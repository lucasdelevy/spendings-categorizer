import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, ScheduledEvent } from "aws-lambda";
import { getCorsHeaders } from "../middleware/cors.js";
import { verifyJWT, extractBearerToken } from "../middleware/auth.js";
import { getSession } from "../services/sessionService.js";
import { getUser } from "../services/userService.js";
import { getMonthStatements, saveStatement } from "../services/statementService.js";
import { getConfig } from "../services/categoryService.js";
import {
  fetchTransactions,
  triggerManualSync,
  mapPierreTransaction,
  type PierreTransaction,
} from "../services/pierreService.js";
import { findDuplicates } from "../services/dedupService.js";
import {
  listAccounts,
  decryptApiKey,
  computeBillingMonth,
} from "../services/accountService.js";
import type {
  JWTPayload,
  TransactionItem,
  CategoryConfigRecord,
  AccountRecord,
} from "../types.js";

const PIERRE_API_KEY = process.env.PIERRE_API_KEY || "";
const PIERRE_USER_ID = process.env.PIERRE_USER_ID || "";

function respond(statusCode: number, body: unknown, origin?: string): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: getCorsHeaders(origin),
    body: JSON.stringify(body),
  };
}

async function authenticate(event: APIGatewayProxyEventV2): Promise<JWTPayload | null> {
  const token = extractBearerToken(event.headers?.authorization);
  if (!token) return null;
  const payload = await verifyJWT(token);
  if (!payload) return null;
  const session = await getSession(payload.userId, payload.sessionId);
  if (!session) return null;
  return payload;
}

function getMonthRange(yearMonth: string): { startDate: string; endDate: string } {
  const year = parseInt(yearMonth.slice(0, 4), 10);
  const month = parseInt(yearMonth.slice(4, 6), 10);

  const start = new Date(year, month - 1, 1);
  start.setDate(start.getDate() - 1);

  const end = new Date(year, month, 1);

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return { startDate: fmt(start), endDate: fmt(end) };
}

function categorizeTransaction(
  tx: TransactionItem,
  config: CategoryConfigRecord,
): TransactionItem {
  const desc = tx.originalDescription.toLowerCase();

  let bestMatch = "";
  let bestCategory = "";

  for (const [catName, entry] of Object.entries(config.categories)) {
    for (const kw of entry.keywords) {
      const kwLower = kw.toLowerCase();
      if (desc.includes(kwLower) && kwLower.length > bestMatch.length) {
        bestMatch = kwLower;
        bestCategory = catName;
      }
    }
  }

  if (bestCategory) {
    return { ...tx, category: bestCategory };
  }
  return tx;
}

function applyRenameRules(tx: TransactionItem, rename: Record<string, string>): TransactionItem {
  const lower = tx.payee.toLowerCase();
  if (rename[lower]) {
    return { ...tx, payee: rename[lower] };
  }
  return tx;
}

function normalizeName(value: string | undefined | null): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function searchAccountPool(
  pool: AccountRecord[],
  source: "bank" | "card",
  remoteName: string,
): AccountRecord | undefined {
  const sameType = pool.filter((a) => a.type === source);
  if (sameType.length === 0) return undefined;

  if (remoteName) {
    const exact = sameType.find((a) => normalizeName(a.name) === remoteName);
    if (exact) return exact;
    const partial = sameType.find((a) => {
      const local = normalizeName(a.name);
      return local && (local.includes(remoteName) || remoteName.includes(local));
    });
    if (partial) return partial;
  }

  if (sameType.length === 1) return sameType[0];
  return undefined;
}

/**
 * Pick the local account a Pierre transaction belongs to.
 *
 * The most reliable signal we have is the API token: each Pierre key is
 * registered against one or more of the user's accounts, so accounts sharing
 * the token are by definition the only ones whose data this fetch can
 * possibly contain. We always look there first — that way, even if Pierre
 * omits `account_name` (or returns an unfamiliar one), card transactions
 * coming through a token attached to a single card still pick up that card's
 * closing day and roll into the right billing month.
 *
 * If the token has no account of the matching type (e.g. the env-fallback
 * key, or a token only attached to bank accounts handling card data), we
 * widen the search to every account the user owns.
 */
function pickLocalAccount(
  pierreTx: PierreTransaction,
  source: "bank" | "card",
  tokenAccounts: AccountRecord[],
  ownedAccounts: AccountRecord[],
): AccountRecord | undefined {
  const remoteName = normalizeName(pierreTx.account_name);

  const fromToken = searchAccountPool(tokenAccounts, source, remoteName);
  if (fromToken) return fromToken;

  return searchAccountPool(ownedAccounts, source, remoteName);
}

interface SyncBatchInput {
  apiKey: string;
  label: string;
  tokenAccounts: AccountRecord[];
}

/**
 * Run one sync pass against a single Pierre API key, routing each transaction
 * into the best-matching local account so card billing-month bucketing always
 * uses that account's closing day. We sync N months in one pass so that a
 * card transaction made in April after the closing day still lands in May.
 */
async function syncBatch(
  input: SyncBatchInput,
  yearMonths: string[],
  userId: string,
  familyId: string | undefined,
  uploadedBy: { userId: string; name: string; picture: string },
  config: CategoryConfigRecord,
  ownedAccounts: AccountRecord[],
): Promise<{ imported: number; duplicates: number }> {
  if (yearMonths.length === 0) return { imported: 0, duplicates: 0 };

  const sortedMonths = [...yearMonths].sort();
  const firstMonth = sortedMonths[0];
  const lastMonth = sortedMonths[sortedMonths.length - 1];
  const { startDate } = getMonthRange(firstMonth);
  const { endDate } = getMonthRange(lastMonth);

  const pierreTxs = await fetchTransactions(input.apiKey, startDate, endDate);
  if (pierreTxs.length === 0) return { imported: 0, duplicates: 0 };

  // Bucket each transaction by its computed billingMonth, using the matching
  // local account's closing day when one is available.
  const buckets = new Map<string, TransactionItem[]>();

  for (const pierreTx of pierreTxs) {
    const mapped = mapPierreTransaction(pierreTx);
    const source = (mapped.source ?? (pierreTx.account_type === "BANK" ? "bank" : "card")) as
      | "bank"
      | "card";
    const txDateMonth = mapped.date.replace(/-/g, "").slice(0, 6);

    const resolvedAccount = pickLocalAccount(
      pierreTx,
      source,
      input.tokenAccounts,
      ownedAccounts,
    );

    const closingDay =
      resolvedAccount?.type === "card" ? resolvedAccount.closingDay : undefined;
    const billingMonth =
      computeBillingMonth(mapped.date, resolvedAccount?.type ?? source, closingDay) ||
      txDateMonth;

    const enriched: TransactionItem = {
      ...mapped,
      billingMonth,
      ...(resolvedAccount ? { accountId: resolvedAccount.accountId } : {}),
    };

    if (!buckets.has(billingMonth)) buckets.set(billingMonth, []);
    buckets.get(billingMonth)!.push(enriched);
  }

  let totalImported = 0;
  let totalDupes = 0;

  for (const [ym, bucketTxs] of buckets.entries()) {
    const existingRecords = await getMonthStatements(userId, ym, familyId);
    const existingTxs: TransactionItem[] = [];
    for (const r of existingRecords) {
      existingTxs.push(...r.transactions);
    }

    const existingExternalIds = new Set<string>();
    for (const tx of existingTxs) {
      if (tx.origin === "openfinance" && tx.externalId) {
        existingExternalIds.add(tx.externalId);
      }
    }

    const afterPass1 = bucketTxs.filter(
      (tx) => !tx.externalId || !existingExternalIds.has(tx.externalId),
    );
    const pass1Dupes = bucketTxs.length - afterPass1.length;

    const { newTransactions, duplicateCount: pass2Dupes } = findDuplicates(afterPass1, existingTxs);
    totalDupes += pass1Dupes + pass2Dupes;

    if (newTransactions.length === 0) continue;

    const categorized = newTransactions
      .map((tx) => categorizeTransaction(tx, config))
      .map((tx) => applyRenameRules(tx, config.rename));

    const bankTxs = categorized.filter((tx) => tx.source === "bank");
    const cardTxs = categorized.filter((tx) => tx.source === "card");

    const saves: Promise<unknown>[] = [];

    if (bankTxs.length > 0) {
      saves.push(
        saveStatement({
          userId,
          familyId,
          yearMonth: ym,
          type: "bank",
          fileName: `Pierre Sync (bank) [${input.label}]`,
          summary: buildSummary("bank", bankTxs),
          transactions: bankTxs,
          uploadedBy,
        }),
      );
    }
    if (cardTxs.length > 0) {
      saves.push(
        saveStatement({
          userId,
          familyId,
          yearMonth: ym,
          type: "card",
          fileName: `Pierre Sync (card) [${input.label}]`,
          summary: buildSummary("card", cardTxs),
          transactions: cardTxs,
          uploadedBy,
        }),
      );
    }

    await Promise.all(saves);
    totalImported += newTransactions.length;
  }

  return { imported: totalImported, duplicates: totalDupes };
}

async function syncMonths(
  yearMonths: string[],
  userId: string,
  familyId: string | undefined,
  uploadedBy: { userId: string; name: string; picture: string },
  config: CategoryConfigRecord,
): Promise<{ imported: number; duplicates: number }> {
  let totalImported = 0;
  let totalDupes = 0;

  const ownedAccounts = await listAccounts(userId, familyId);
  const accountsWithKeys = ownedAccounts.filter((a) => !!a.apiKeyEncrypted);

  // Group accounts by the API key they share. Pierre returns the full
  // transaction set per key, so we only need one fetch per unique key — but
  // we keep the full list of accounts that registered that key so we can
  // route every transaction to one of them (and thus pick up its closing
  // day) without depending on Pierre's account_name string matching.
  const tokenAccounts = new Map<string, AccountRecord[]>();
  const tokenLabels = new Map<string, string>();

  for (const account of accountsWithKeys) {
    try {
      const apiKey = decryptApiKey(account.apiKeyEncrypted!);
      const existing = tokenAccounts.get(apiKey);
      if (existing) {
        existing.push(account);
      } else {
        tokenAccounts.set(apiKey, [account]);
        tokenLabels.set(apiKey, account.name);
      }
    } catch (err) {
      console.error(`Failed to decrypt key for account ${account.accountId}:`, err);
    }
  }

  if (PIERRE_API_KEY && !tokenAccounts.has(PIERRE_API_KEY)) {
    tokenAccounts.set(PIERRE_API_KEY, []);
    tokenLabels.set(PIERRE_API_KEY, "env");
  }

  const batches: SyncBatchInput[] = Array.from(tokenAccounts.entries()).map(
    ([apiKey, accounts]) => ({
      apiKey,
      label: tokenLabels.get(apiKey) ?? "",
      tokenAccounts: accounts,
    }),
  );

  for (const batch of batches) {
    try {
      const result = await syncBatch(
        batch,
        yearMonths,
        userId,
        familyId,
        uploadedBy,
        config,
        ownedAccounts,
      );
      totalImported += result.imported;
      totalDupes += result.duplicates;
    } catch (err) {
      console.error(`Pierre sync failed for batch ${batch.label}:`, err);
    }
  }

  return { imported: totalImported, duplicates: totalDupes };
}

function buildSummary(type: "bank" | "card", txs: TransactionItem[]) {
  let totalIn = 0;
  let totalOut = 0;
  const catMap = new Map<string, { category: string; total: number; count: number }>();

  for (const tx of txs) {
    if (tx.amount >= 0) totalIn += tx.amount;
    else totalOut += tx.amount;

    const existing = catMap.get(tx.category);
    if (existing) {
      existing.total += tx.amount;
      existing.count += 1;
    } else {
      catMap.set(tx.category, { category: tx.category, total: tx.amount, count: 1 });
    }
  }

  return {
    type: type as "bank" | "card" | "family",
    totalIn,
    totalOut,
    balance: totalIn + totalOut,
    categories: Array.from(catMap.values()),
  };
}

function getDefaultSyncMonths(): string[] {
  const now = new Date();
  const fmt = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;

  // Sync the previous, current, and next month. The next month is included so
  // card transactions made after the closing day land in their billing month
  // even before the calendar has rolled over.
  return [
    fmt(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
    fmt(now),
    fmt(new Date(now.getFullYear(), now.getMonth() + 1, 1)),
  ];
}

async function handleScheduled(): Promise<void> {
  if (!PIERRE_USER_ID) {
    console.log("PIERRE_USER_ID not set; skipping scheduled sync");
    return;
  }

  const userRecord = await getUser(PIERRE_USER_ID);
  if (!userRecord) {
    console.error(`User ${PIERRE_USER_ID} not found`);
    return;
  }

  const config = await getConfig(PIERRE_USER_ID, userRecord.familyId);
  const uploadedBy = {
    userId: PIERRE_USER_ID,
    name: userRecord.name,
    picture: userRecord.picture,
  };

  const months = getDefaultSyncMonths();
  const result = await syncMonths(months, PIERRE_USER_ID, userRecord.familyId, uploadedBy, config);
  console.log(
    `Sync months=${months.join(",")}: imported=${result.imported} duplicates=${result.duplicates}`,
  );
}

async function handleManualSync(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;

  const user = await authenticate(event);
  if (!user) return respond(401, { error: "Unauthorized" }, origin);

  const body = JSON.parse(event.body || "{}");
  const requestedMonth = body.yearMonth as string | undefined;

  const userRecord = await getUser(user.userId);
  if (!userRecord) return respond(500, { error: "User record not found" }, origin);

  const accounts = await listAccounts(user.userId, userRecord.familyId);
  const hasAccountKeys = accounts.some((a) => !!a.apiKeyEncrypted);
  const isPierreEnvUser = user.userId === PIERRE_USER_ID && PIERRE_API_KEY;

  if (!hasAccountKeys && !isPierreEnvUser) {
    return respond(403, {
      error:
        "No Open Finance API key configured. Add a key to one of your accounts before triggering a sync.",
    }, origin);
  }

  const config = await getConfig(user.userId, userRecord.familyId);
  const uploadedBy = {
    userId: user.userId,
    name: userRecord.name,
    picture: userRecord.picture,
  };

  if (body.manualUpdate) {
    if (typeof body.accountId === "string") {
      const acct = accounts.find((a) => a.accountId === body.accountId);
      if (acct?.apiKeyEncrypted) {
        try {
          await triggerManualSync(decryptApiKey(acct.apiKeyEncrypted));
        } catch (err) {
          console.error("triggerManualSync failed:", err);
        }
      }
    } else if (PIERRE_API_KEY) {
      await triggerManualSync(PIERRE_API_KEY);
    }
  }

  const months = requestedMonth ? [requestedMonth] : getDefaultSyncMonths();
  const result = await syncMonths(
    months,
    user.userId,
    userRecord.familyId,
    uploadedBy,
    config,
  );

  return respond(200, { months, result }, origin);
}

export async function handler(
  event: APIGatewayProxyEventV2 | ScheduledEvent,
): Promise<APIGatewayProxyResultV2 | void> {
  if ("source" in event && event.source === "aws.events") {
    return handleScheduled();
  }

  const apiEvent = event as APIGatewayProxyEventV2;
  const origin = apiEvent.headers?.origin;

  if (apiEvent.requestContext?.http?.method === "OPTIONS") {
    return respond(204, "", origin);
  }

  return handleManualSync(apiEvent);
}
