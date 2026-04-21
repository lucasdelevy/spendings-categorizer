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
} from "../services/statementService.js";
import type { JWTPayload, TransactionItem } from "../types.js";

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
    return {
      id: s.SK.replace("STMT#", ""),
      fileName: s.fileName,
      uploadedAt: s.uploadedAt,
      type: s.summary.type,
      totalOut: s.summary.totalOut,
      categoryCount: s.summary.categories.length,
      transactionCount: s.transactions.length,
      uploadedBy: firstTx?.uploadedBy || null,
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
  if (records.length === 0) {
    return respond(404, { error: "Statement not found" }, origin);
  }

  const allTransactions: TransactionItem[] = [];
  for (const r of records) {
    allTransactions.push(...r.transactions);
  }

  let totalIn = 0;
  let totalOut = 0;
  for (const t of allTransactions) {
    if (t.amount >= 0) totalIn += t.amount;
    else totalOut += t.amount;
  }

  const catMap = new Map<string, { category: string; total: number; count: number }>();
  for (const t of allTransactions) {
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

  const { yearMonth, type, fileName, summary, transactions } = body;
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

  const record = await saveStatement({
    userId: user.userId,
    familyId,
    yearMonth,
    type,
    fileName,
    summary,
    transactions,
    uploadedBy: {
      userId: user.userId,
      name: userRecord?.name || "",
      picture: userRecord?.picture || "",
    },
  });

  return respond(201, {
    id: record.SK.replace("STMT#", ""),
    fileName: record.fileName,
    uploadedAt: record.uploadedAt,
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
  if (method === "GET" && path.startsWith("/statements/")) return handleGet(event, user);
  if (method === "DELETE" && path.startsWith("/statements/")) return handleDelete(event, user);

  return respond(404, { error: "Not found" }, origin);
}
