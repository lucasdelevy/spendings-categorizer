import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { getCorsHeaders } from "../middleware/cors.js";
import { verifyJWT, extractBearerToken } from "../middleware/auth.js";
import { getSession } from "../services/sessionService.js";
import { getUser } from "../services/userService.js";
import {
  getConfig,
  saveConfig,
  addKeywordToCategory,
  addRenameMapping,
  addIgnorePattern,
  createCategoryEntry,
} from "../services/categoryService.js";
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
  const { statementId, transactionIndex, newCategory, keyword, createCategory: shouldCreate, color, applyToSimilar } = body;

  if (!statementId || transactionIndex === undefined || !newCategory) {
    return respond(400, { error: "statementId, transactionIndex, and newCategory are required" }, origin);
  }

  const userRecord = await getUser(user.userId);
  const familyId = userRecord?.familyId;

  const { record, localIdx } = await resolveTransaction(statementId, transactionIndex, user.userId, familyId);

  if (!record) {
    return respond(404, { error: "Statement not found" }, origin);
  }

  const source = record.transactions[localIdx]?.source ?? "bank";
  const originalDesc = record.transactions[localIdx].originalDescription;

  if (shouldCreate && color) {
    await createCategoryEntry(user.userId, familyId, source, newCategory, color);
  }

  record.transactions[localIdx].category = newCategory;

  if (applyToSimilar && originalDesc) {
    const descLower = originalDesc.toLowerCase();
    for (const tx of record.transactions) {
      if (tx.originalDescription.toLowerCase() === descLower) {
        tx.category = newCategory;
      }
    }
  }

  await docClient.send(
    new PutCommand({ TableName: TABLE_NAME, Item: record }),
  );

  if (applyToSimilar && familyId && originalDesc) {
    const [yearMonth] = statementId.split("#");
    const allRecords = await getFamilyMonthStatements(familyId, yearMonth);
    const descLower = originalDesc.toLowerCase();
    for (const r of allRecords) {
      if (r.PK === record.PK && r.SK === record.SK) continue;
      let changed = false;
      for (const tx of r.transactions) {
        if (tx.originalDescription.toLowerCase() === descLower) {
          tx.category = newCategory;
          changed = true;
        }
      }
      if (changed) {
        await docClient.send(
          new PutCommand({ TableName: TABLE_NAME, Item: r }),
        );
      }
    }
  }

  if (keyword) {
    await addKeywordToCategory(user.userId, familyId, source, newCategory, keyword);
  }

  return respond(200, { message: "Recategorized" }, origin);
}

async function handleRename(
  event: APIGatewayProxyEventV2,
  user: JWTPayload,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const body = JSON.parse(event.body || "{}");
  const { statementId, transactionIndex, newPayeeName } = body;

  if (!statementId || transactionIndex === undefined || !newPayeeName) {
    return respond(400, { error: "statementId, transactionIndex, and newPayeeName are required" }, origin);
  }

  const userRecord = await getUser(user.userId);
  const familyId = userRecord?.familyId;

  const { record, localIdx } = await resolveTransaction(statementId, transactionIndex, user.userId, familyId);

  if (!record) {
    return respond(404, { error: "Statement not found" }, origin);
  }

  const tx = record.transactions[localIdx];
  const source = tx.source ?? "bank";
  const originalDesc = tx.originalDescription;

  tx.payee = newPayeeName;
  await docClient.send(
    new PutCommand({ TableName: TABLE_NAME, Item: record }),
  );

  await addRenameMapping(user.userId, familyId, source, originalDesc, newPayeeName);

  return respond(200, { message: "Renamed" }, origin);
}

async function handleIgnore(
  event: APIGatewayProxyEventV2,
  user: JWTPayload,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const body = JSON.parse(event.body || "{}");
  const { statementId, transactionIndex } = body;

  if (!statementId || transactionIndex === undefined) {
    return respond(400, { error: "statementId and transactionIndex are required" }, origin);
  }

  const userRecord = await getUser(user.userId);
  const familyId = userRecord?.familyId;

  const { record, localIdx } = await resolveTransaction(statementId, transactionIndex, user.userId, familyId);

  if (!record) {
    return respond(404, { error: "Statement not found" }, origin);
  }

  const tx = record.transactions[localIdx];
  const source = tx.source ?? "bank";
  const pattern = tx.originalDescription;

  record.transactions.splice(localIdx, 1);

  let totalIn = 0;
  let totalOut = 0;
  const catMap = new Map<string, { category: string; total: number; count: number }>();
  for (const t of record.transactions) {
    if (t.amount >= 0) totalIn += t.amount;
    else totalOut += t.amount;
    const existing = catMap.get(t.category);
    if (existing) {
      existing.total += t.amount;
      existing.count += 1;
    } else {
      catMap.set(t.category, { category: t.category, total: t.amount, count: 1 });
    }
  }
  record.summary = {
    ...record.summary,
    totalIn,
    totalOut,
    balance: totalIn + totalOut,
    categories: Array.from(catMap.values()),
  };

  await docClient.send(
    new PutCommand({ TableName: TABLE_NAME, Item: record }),
  );

  await addIgnorePattern(user.userId, familyId, source, pattern);

  return respond(200, { message: "Ignored" }, origin);
}

async function resolveTransaction(
  statementId: string,
  globalIndex: number,
  userId: string,
  familyId?: string,
): Promise<{ record: StatementRecord | null; localIdx: number }> {
  if (familyId) {
    const [yearMonth, idPart] = statementId.split("#");
    if (!yearMonth || !idPart) return { record: null, localIdx: 0 };

    if (idPart === "family") {
      const records = await getFamilyMonthStatements(familyId, yearMonth);
      let idx = globalIndex;
      for (const r of records) {
        if (idx < r.transactions.length) {
          return { record: r, localIdx: idx };
        }
        idx -= r.transactions.length;
      }
      return { record: null, localIdx: 0 };
    }

    const record = await getStatement(idPart, yearMonth, "", familyId);
    return { record, localIdx: globalIndex };
  }

  const [yearMonth, type] = statementId.split("#");
  if (!yearMonth || !type) return { record: null, localIdx: 0 };

  const record = await getStatement(userId, yearMonth, type);
  return { record, localIdx: globalIndex };
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
  if (method === "POST" && path === "/categories/rename") return handleRename(event, user);
  if (method === "POST" && path === "/categories/ignore") return handleIgnore(event, user);

  return respond(404, { error: "Not found" }, origin);
}
