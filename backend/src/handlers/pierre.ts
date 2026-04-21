import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, ScheduledEvent } from "aws-lambda";
import { getCorsHeaders } from "../middleware/cors.js";
import { verifyJWT, extractBearerToken } from "../middleware/auth.js";
import { getSession } from "../services/sessionService.js";
import { getUser } from "../services/userService.js";
import { getMonthStatements, saveStatement } from "../services/statementService.js";
import { getConfig } from "../services/categoryService.js";
import { fetchTransactions, triggerManualSync, mapPierreTransaction } from "../services/pierreService.js";
import { findDuplicates } from "../services/dedupService.js";
import type { JWTPayload, TransactionItem, CategoryConfigRecord } from "../types.js";

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

async function syncMonth(
  yearMonth: string,
  userId: string,
  familyId: string | undefined,
  uploadedBy: { userId: string; name: string; picture: string },
  config: CategoryConfigRecord,
): Promise<{ imported: number; duplicates: number }> {
  const { startDate, endDate } = getMonthRange(yearMonth);

  const pierreTxs = await fetchTransactions(PIERRE_API_KEY, startDate, endDate);
  if (pierreTxs.length === 0) {
    return { imported: 0, duplicates: 0 };
  }

  const targetYearMonth = `${yearMonth.slice(0, 4)}-${yearMonth.slice(4, 6)}`;
  const mapped = pierreTxs
    .map(mapPierreTransaction)
    .filter((tx) => tx.date.startsWith(targetYearMonth));

  if (mapped.length === 0) {
    return { imported: 0, duplicates: 0 };
  }

  const existingRecords = await getMonthStatements(userId, yearMonth, familyId);
  const existingTxs: TransactionItem[] = [];
  for (const r of existingRecords) {
    existingTxs.push(...r.transactions);
  }

  // Pass 1: Pierre-vs-Pierre dedup via externalId
  const existingExternalIds = new Set<string>();
  for (const tx of existingTxs) {
    if (tx.origin === "openfinance" && tx.externalId) {
      existingExternalIds.add(tx.externalId);
    }
  }

  const afterPass1 = mapped.filter(
    (tx) => !tx.externalId || !existingExternalIds.has(tx.externalId),
  );
  const pass1Dupes = mapped.length - afterPass1.length;

  // Pass 2: fingerprint-based dedup (catches Pierre-vs-CSV overlaps)
  const { newTransactions, duplicateCount: pass2Dupes } = findDuplicates(afterPass1, existingTxs);

  if (newTransactions.length === 0) {
    return { imported: 0, duplicates: pass1Dupes + pass2Dupes };
  }

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
        yearMonth,
        type: "bank",
        fileName: `Pierre Sync (bank)`,
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
        yearMonth,
        type: "card",
        fileName: `Pierre Sync (card)`,
        summary: buildSummary("card", cardTxs),
        transactions: cardTxs,
        uploadedBy,
      }),
    );
  }

  await Promise.all(saves);

  return { imported: newTransactions.length, duplicates: pass1Dupes + pass2Dupes };
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

function getCurrentAndPreviousMonths(): string[] {
  const now = new Date();
  const current = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previous = `${prev.getFullYear()}${String(prev.getMonth() + 1).padStart(2, "0")}`;

  return [current, previous];
}

async function handleScheduled(): Promise<void> {
  if (!PIERRE_API_KEY || !PIERRE_USER_ID) {
    console.error("Missing PIERRE_API_KEY or PIERRE_USER_ID env vars");
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

  const months = getCurrentAndPreviousMonths();
  for (const ym of months) {
    const result = await syncMonth(ym, PIERRE_USER_ID, userRecord.familyId, uploadedBy, config);
    console.log(`Sync ${ym}: imported=${result.imported} duplicates=${result.duplicates}`);
  }
}

async function handleManualSync(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;

  const user = await authenticate(event);
  if (!user) return respond(401, { error: "Unauthorized" }, origin);

  if (user.userId !== PIERRE_USER_ID) {
    return respond(403, { error: "Forbidden" }, origin);
  }

  const body = JSON.parse(event.body || "{}");
  const requestedMonth = body.yearMonth as string | undefined;

  const userRecord = await getUser(user.userId);
  if (!userRecord) return respond(500, { error: "User record not found" }, origin);

  const config = await getConfig(user.userId, userRecord.familyId);
  const uploadedBy = {
    userId: user.userId,
    name: userRecord.name,
    picture: userRecord.picture,
  };

  if (body.manualUpdate) {
    await triggerManualSync(PIERRE_API_KEY);
  }

  const months = requestedMonth ? [requestedMonth] : getCurrentAndPreviousMonths();
  const results: Record<string, { imported: number; duplicates: number }> = {};

  for (const ym of months) {
    results[ym] = await syncMonth(ym, user.userId, userRecord.familyId, uploadedBy, config);
  }

  return respond(200, { results }, origin);
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
