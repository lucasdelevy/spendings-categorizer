import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { getCorsHeaders } from "../middleware/cors.js";
import { verifyJWT, extractBearerToken } from "../middleware/auth.js";
import { getSession } from "../services/sessionService.js";
import { getUser } from "../services/userService.js";
import {
  saveStatement,
  getMonthStatements,
  listStatements,
  softDeleteByFullSK,
  getStatementByFullSK,
} from "../services/statementService.js";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../services/dynamoClient.js";
import { findDuplicates } from "../services/dedupService.js";
import {
  getAccount,
  computeBillingMonth,
  listAccounts,
} from "../services/accountService.js";
import type { JWTPayload, TransactionItem, AccountRecord } from "../types.js";

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

async function handleList(
  event: APIGatewayProxyEventV2,
  user: JWTPayload,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const userRecord = await getUser(user.userId);
  const familyId = userRecord?.familyId;

  const statements = await listStatements(user.userId, familyId);

  const items = statements.map((s) => {
    const firstTx = s.transactions[0];
    const accountIds = new Set<string>();
    for (const tx of s.transactions) {
      if (tx.accountId) accountIds.add(tx.accountId);
    }
    return {
      id: s.SK.replace("STMT#", ""),
      fileName: s.fileName,
      uploadedAt: s.uploadedAt,
      type: s.summary.type,
      totalOut: s.summary.totalOut,
      categoryCount: s.summary.categories.length,
      transactionCount: s.transactions.length,
      uploadedBy: firstTx?.uploadedBy || null,
      accountId: accountIds.size === 1 ? Array.from(accountIds)[0] : null,
      mixedAccounts: accountIds.size > 1,
    };
  });

  return respond(200, { statements: items }, origin);
}

async function handleGet(
  event: APIGatewayProxyEventV2,
  user: JWTPayload,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const id = event.pathParameters?.id;
  if (!id) return respond(400, { error: "Missing statement id" }, origin);

  const [yearMonth] = id.split("#");
  if (!yearMonth || !/^\d{6}$/.test(yearMonth)) {
    return respond(400, { error: "Invalid statement id" }, origin);
  }

  const userRecord = await getUser(user.userId);
  const familyId = userRecord?.familyId;

  const records = await getMonthStatements(user.userId, yearMonth, familyId);
  // Pull all card transactions from neighbouring months too, so we can route
  // legacy un-bucketed entries to the right billing window when their account
  // has a closing day.
  const accounts = await listAccounts(user.userId, familyId);
  const cardAccountsWithClosing = new Map<string, number>();
  for (const a of accounts) {
    if (a.type === "card" && a.closingDay) {
      cardAccountsWithClosing.set(a.accountId, a.closingDay);
    }
  }

  let extraRecords: typeof records = [];
  if (cardAccountsWithClosing.size > 0) {
    const neighbours = await Promise.all([
      getMonthStatements(user.userId, shiftYearMonth(yearMonth, -1), familyId),
      getMonthStatements(user.userId, shiftYearMonth(yearMonth, 1), familyId),
    ]);
    extraRecords = neighbours.flat();
  }

  if (records.length === 0 && extraRecords.length === 0) {
    return respond(404, { error: "Statement not found" }, origin);
  }

  const allTransactions: TransactionItem[] = [];
  for (const r of records) {
    for (const tx of r.transactions) {
      const billingMonth = resolveBillingMonth(tx, cardAccountsWithClosing);
      if (!billingMonth || billingMonth === yearMonth) {
        allTransactions.push(tx);
      }
    }
  }
  for (const r of extraRecords) {
    for (const tx of r.transactions) {
      const billingMonth = resolveBillingMonth(tx, cardAccountsWithClosing);
      if (billingMonth === yearMonth) {
        allTransactions.push(tx);
      }
    }
  }

  if (allTransactions.length === 0) {
    return respond(404, { error: "Statement not found" }, origin);
  }

  let totalIn = 0;
  let totalOut = 0;
  for (const t of allTransactions) {
    if (t.hidden) continue;
    if (t.amount >= 0) totalIn += t.amount;
    else totalOut += t.amount;
  }

  const catMap = new Map<string, { category: string; total: number; count: number }>();
  for (const t of allTransactions) {
    if (t.hidden) continue;
    const existing = catMap.get(t.category);
    if (existing) {
      existing.total += t.amount;
      existing.count += 1;
    } else {
      catMap.set(t.category, { category: t.category, total: t.amount, count: 1 });
    }
  }

  const types = new Set(records.map((r) => r.summary.type));
  const type = familyId || types.size > 1 ? "family" : records[0].summary.type;

  return respond(200, {
    id: `${yearMonth}#${type}`,
    fileName: records.map((r) => r.fileName).join(", "),
    uploadedAt: records[0].uploadedAt,
    summary: {
      type,
      totalIn,
      totalOut,
      balance: totalIn + totalOut,
      categories: Array.from(catMap.values()),
    },
    transactions: allTransactions,
  }, origin);
}

async function handleSave(
  event: APIGatewayProxyEventV2,
  user: JWTPayload,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const body = JSON.parse(event.body || "{}");

  const { yearMonth, type, fileName, summary, transactions, accountId } = body;
  if (!yearMonth || !type || !fileName || !summary || !transactions) {
    return respond(400, { error: "Missing required fields: yearMonth, type, fileName, summary, transactions" }, origin);
  }

  if (!/^\d{6}$/.test(yearMonth)) {
    return respond(400, { error: "yearMonth must be in YYYYMM format" }, origin);
  }

  if (!["bank", "card", "family"].includes(type)) {
    return respond(400, { error: "type must be bank, card, or family" }, origin);
  }

  const userRecord = await getUser(user.userId);
  const familyId = userRecord?.familyId;
  const uploadedBy = {
    userId: user.userId,
    name: userRecord?.name || "",
    picture: userRecord?.picture || "",
  };

  let account: AccountRecord | null = null;
  if (accountId) {
    account = await getAccount(user.userId, familyId, accountId);
    if (!account) {
      return respond(400, { error: "Invalid accountId" }, origin);
    }
  }

  const incomingTxs = (transactions as TransactionItem[]).map((t) => {
    const next: TransactionItem = { ...t };
    if (account) next.accountId = account.accountId;
    if (!next.billingMonth) {
      const computed = computeBillingMonth(
        next.date,
        account?.type ?? next.source,
        account?.type === "card" ? account.closingDay : undefined,
      );
      if (computed) next.billingMonth = computed;
    }
    return next;
  });

  // Group by billingMonth so card statements with closing days are saved
  // under the right month bucket.
  const groups = new Map<string, TransactionItem[]>();
  for (const tx of incomingTxs) {
    const ym = tx.billingMonth || yearMonth;
    if (!groups.has(ym)) groups.set(ym, []);
    groups.get(ym)!.push(tx);
  }

  let totalImported = 0;
  let totalDuplicates = 0;
  const savedRecords: { id: string; fileName: string; uploadedAt: string }[] = [];

  for (const [ym, txs] of groups.entries()) {
    const existingRecords = await getMonthStatements(user.userId, ym, familyId);
    const existingTxs: TransactionItem[] = [];
    for (const r of existingRecords) {
      existingTxs.push(...r.transactions);
    }

    const { newTransactions, duplicateCount } = findDuplicates(txs, existingTxs);
    totalDuplicates += duplicateCount;
    if (newTransactions.length === 0) continue;

    const recomputedSummary = recomputeSummary(type, newTransactions);
    const record = await saveStatement({
      userId: user.userId,
      familyId,
      yearMonth: ym,
      type,
      fileName,
      summary: recomputedSummary,
      transactions: newTransactions,
      uploadedBy,
    });
    totalImported += newTransactions.length;
    savedRecords.push({
      id: record.SK.replace("STMT#", ""),
      fileName: record.fileName,
      uploadedAt: record.uploadedAt,
    });
  }

  if (totalImported === 0) {
    return respond(200, {
      message: "All transactions already exist",
      duplicateCount: totalDuplicates,
      importedCount: 0,
    }, origin);
  }

  return respond(201, {
    saved: savedRecords,
    duplicateCount: totalDuplicates,
    importedCount: totalImported,
  }, origin);
}

function shiftYearMonth(yearMonth: string, delta: number): string {
  const year = parseInt(yearMonth.slice(0, 4), 10);
  const month = parseInt(yearMonth.slice(4, 6), 10);
  const total = (year * 12 + (month - 1)) + delta;
  const newYear = Math.floor(total / 12);
  const newMonth = (total % 12) + 1;
  return `${newYear}${String(newMonth).padStart(2, "0")}`;
}

function resolveBillingMonth(
  tx: TransactionItem,
  cardAccountsWithClosing: Map<string, number>,
): string | undefined {
  if (tx.billingMonth) return tx.billingMonth;
  if (tx.accountId) {
    const closing = cardAccountsWithClosing.get(tx.accountId);
    if (closing) {
      return computeBillingMonth(tx.date, "card", closing);
    }
  }
  return undefined;
}

function recomputeSummary(type: string, txs: TransactionItem[]) {
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

async function handleAssignAccount(
  event: APIGatewayProxyEventV2,
  user: JWTPayload,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const id = event.pathParameters?.id;
  if (!id) return respond(400, { error: "Missing statement id" }, origin);

  const body = JSON.parse(event.body || "{}");
  const accountId: string | null = body.accountId ?? null;

  const userRecord = await getUser(user.userId);
  const familyId = userRecord?.familyId;
  const pk = familyId ? `FAMILY#${familyId}` : `USER#${user.userId}`;
  const sk = `STMT#${id}`;

  const record = await getStatementByFullSK(pk, sk);
  if (!record) return respond(404, { error: "Statement not found" }, origin);

  let account = null;
  if (accountId) {
    account = await getAccount(user.userId, familyId, accountId);
    if (!account) return respond(400, { error: "Invalid accountId" }, origin);
  }

  const closingDay =
    account?.type === "card" ? account.closingDay : undefined;

  const updatedTxs: TransactionItem[] = record.transactions.map((tx) => {
    const next: TransactionItem = { ...tx };
    if (account) {
      next.accountId = account.accountId;
      const computed = computeBillingMonth(
        next.date,
        account.type ?? next.source,
        closingDay,
      );
      if (computed) next.billingMonth = computed;
    } else {
      delete next.accountId;
      delete next.billingMonth;
    }
    return next;
  });

  // Group by billing month so card transactions outside the record's month
  // bucket get split into a separate statement record under the right month.
  const recordYearMonth = id.split("#")[0];
  const sameMonth: TransactionItem[] = [];
  const otherMonths = new Map<string, TransactionItem[]>();

  for (const tx of updatedTxs) {
    const ym = tx.billingMonth || recordYearMonth;
    if (ym === recordYearMonth) {
      sameMonth.push(tx);
    } else {
      if (!otherMonths.has(ym)) otherMonths.set(ym, []);
      otherMonths.get(ym)!.push(tx);
    }
  }

  const uploadedBy = {
    userId: user.userId,
    name: userRecord?.name || "",
    picture: userRecord?.picture || "",
  };

  const createdRecords: { id: string }[] = [];

  for (const [ym, txs] of otherMonths.entries()) {
    const newRecord = await saveStatement({
      userId: user.userId,
      familyId,
      yearMonth: ym,
      type: record.summary.type,
      fileName: record.fileName,
      summary: recomputeSummary(record.summary.type, txs),
      transactions: txs,
      uploadedBy,
    });
    createdRecords.push({ id: newRecord.SK.replace("STMT#", "") });
  }

  if (sameMonth.length === 0) {
    await softDeleteByFullSK(pk, sk);
  } else {
    record.transactions = sameMonth;
    record.summary = recomputeSummary(record.summary.type, sameMonth);
    await docClient.send(
      new PutCommand({ TableName: TABLE_NAME, Item: record }),
    );
  }

  return respond(200, {
    message: "Account assigned",
    accountId: accountId ?? null,
    splitInto: createdRecords,
    keptInPlace: sameMonth.length,
  }, origin);
}

async function handleDelete(
  event: APIGatewayProxyEventV2,
  user: JWTPayload,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const id = event.pathParameters?.id;
  if (!id) return respond(400, { error: "Missing statement id" }, origin);

  const userRecord = await getUser(user.userId);
  const familyId = userRecord?.familyId;
  const pk = familyId ? `FAMILY#${familyId}` : `USER#${user.userId}`;
  const sk = `STMT#${id}`;

  await softDeleteByFullSK(pk, sk);

  return respond(200, { message: "Deleted" }, origin);
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;

  if (event.requestContext.http.method === "OPTIONS") {
    return respond(204, "", origin);
  }

  const user = await authenticate(event);
  if (!user) return respond(401, { error: "Unauthorized" }, origin);

  const path = event.requestContext.http.path;
  const method = event.requestContext.http.method;

  if (method === "GET" && path === "/statements") return handleList(event, user);
  if (method === "POST" && path === "/statements") return handleSave(event, user);
  if (method === "POST" && /^\/statements\/[^/]+\/assign-account$/.test(path)) {
    return handleAssignAccount(event, user);
  }
  if (method === "GET" && path.startsWith("/statements/")) return handleGet(event, user);
  if (method === "DELETE" && path.startsWith("/statements/")) return handleDelete(event, user);

  return respond(404, { error: "Not found" }, origin);
}
