import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { getCorsHeaders } from "../middleware/cors.js";
import { verifyJWT, extractBearerToken } from "../middleware/auth.js";
import { getSession } from "../services/sessionService.js";
import {
  saveStatement,
  getStatement,
  listStatements,
  softDeleteStatement,
} from "../services/statementService.js";
import type { JWTPayload } from "../types.js";

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
  const statements = await listStatements(user.userId);

  const items = statements.map((s) => ({
    id: s.SK.replace("STMT#", ""),
    fileName: s.fileName,
    uploadedAt: s.uploadedAt,
    type: s.summary.type,
    totalOut: s.summary.totalOut,
    categoryCount: s.summary.categories.length,
    transactionCount: s.transactions.length,
  }));

  return respond(200, { statements: items }, origin);
}

async function handleGet(
  event: APIGatewayProxyEventV2,
  user: JWTPayload,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const id = event.pathParameters?.id;
  if (!id) return respond(400, { error: "Missing statement id" }, origin);

  // id format: YYYYMM#type
  const [yearMonth, type] = id.split("#");
  if (!yearMonth || !type) return respond(400, { error: "Invalid statement id" }, origin);

  const statement = await getStatement(user.userId, yearMonth, type);
  if (!statement) return respond(404, { error: "Statement not found" }, origin);

  return respond(200, {
    id: statement.SK.replace("STMT#", ""),
    fileName: statement.fileName,
    uploadedAt: statement.uploadedAt,
    summary: statement.summary,
    transactions: statement.transactions,
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

  const record = await saveStatement({
    userId: user.userId,
    yearMonth,
    type,
    fileName,
    summary,
    transactions,
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

  const [yearMonth, type] = id.split("#");
  if (!yearMonth || !type) return respond(400, { error: "Invalid statement id" }, origin);

  await softDeleteStatement(user.userId, yearMonth, type);
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
