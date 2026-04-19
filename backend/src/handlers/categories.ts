import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { getCorsHeaders } from "../middleware/cors.js";
import { verifyJWT, extractBearerToken } from "../middleware/auth.js";
import { getSession } from "../services/sessionService.js";
import { getUser } from "../services/userService.js";
import { getConfig, saveConfig, addKeywordToCategory } from "../services/categoryService.js";
import { getFamilyMonthStatements, getStatement } from "../services/statementService.js";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../services/dynamoClient.js";
import type { JWTPayload, StatementRecord } from "../types.js";

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

async function handleGet(
  event: APIGatewayProxyEventV2,
  user: JWTPayload,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const userRecord = await getUser(user.userId);
  const config = await getConfig(user.userId, userRecord?.familyId);

  return respond(200, {
    bankCategories: config.bankCategories,
    cardCategories: config.cardCategories,
    bankIgnore: config.bankIgnore,
    cardIgnore: config.cardIgnore,
    bankRename: config.bankRename,
    cardRename: config.cardRename,
  }, origin);
}

async function handlePut(
  event: APIGatewayProxyEventV2,
  user: JWTPayload,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const body = JSON.parse(event.body || "{}");

  const { bankCategories, cardCategories, bankIgnore, cardIgnore, bankRename, cardRename } = body;
  if (!bankCategories || !cardCategories) {
    return respond(400, { error: "bankCategories and cardCategories are required" }, origin);
  }

  const userRecord = await getUser(user.userId);
  const saved = await saveConfig(user.userId, userRecord?.familyId, {
    bankCategories,
    cardCategories,
    bankIgnore: bankIgnore ?? [],
    cardIgnore: cardIgnore ?? [],
    bankRename: bankRename ?? {},
    cardRename: cardRename ?? {},
    updatedAt: "",
  });

  return respond(200, {
    bankCategories: saved.bankCategories,
    cardCategories: saved.cardCategories,
    bankIgnore: saved.bankIgnore,
    cardIgnore: saved.cardIgnore,
    bankRename: saved.bankRename,
    cardRename: saved.cardRename,
  }, origin);
}

async function handleRecategorize(
  event: APIGatewayProxyEventV2,
  user: JWTPayload,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const body = JSON.parse(event.body || "{}");
  const { statementId, transactionIndex, newCategory, keyword } = body;

  if (!statementId || transactionIndex === undefined || !newCategory) {
    return respond(400, { error: "statementId, transactionIndex, and newCategory are required" }, origin);
  }

  const userRecord = await getUser(user.userId);
  const familyId = userRecord?.familyId;

  let record: StatementRecord | null = null;

  if (familyId) {
    const [yearMonth, userId] = statementId.split("#");
    if (!yearMonth || !userId) {
      return respond(400, { error: "Invalid statementId" }, origin);
    }

    if (userId === "family") {
      const records = await getFamilyMonthStatements(familyId, yearMonth);
      let globalIdx = transactionIndex as number;
      for (const r of records) {
        if (globalIdx < r.transactions.length) {
          r.transactions[globalIdx].category = newCategory;
          await docClient.send(
            new PutCommand({ TableName: TABLE_NAME, Item: r }),
          );
          record = r;
          break;
        }
        globalIdx -= r.transactions.length;
      }
    } else {
      record = await getStatement(userId, yearMonth, "", familyId);
      if (record) {
        record.transactions[transactionIndex].category = newCategory;
        await docClient.send(
          new PutCommand({ TableName: TABLE_NAME, Item: record }),
        );
      }
    }
  } else {
    const [yearMonth, type] = statementId.split("#");
    if (!yearMonth || !type) {
      return respond(400, { error: "Invalid statementId" }, origin);
    }
    record = await getStatement(user.userId, yearMonth, type);
    if (record) {
      record.transactions[transactionIndex].category = newCategory;
      await docClient.send(
        new PutCommand({ TableName: TABLE_NAME, Item: record }),
      );
    }
  }

  if (!record) {
    return respond(404, { error: "Statement not found" }, origin);
  }

  if (keyword) {
    const source = record.transactions[transactionIndex]?.source ?? "bank";
    await addKeywordToCategory(user.userId, familyId, source, newCategory, keyword);
  }

  return respond(200, { message: "Recategorized" }, origin);
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

  if (method === "GET" && path === "/categories") return handleGet(event, user);
  if (method === "PUT" && path === "/categories") return handlePut(event, user);
  if (method === "POST" && path === "/categories/recategorize") return handleRecategorize(event, user);

  return respond(404, { error: "Not found" }, origin);
}
