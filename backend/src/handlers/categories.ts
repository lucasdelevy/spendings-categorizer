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
  applyCategoryConfig,
  recategorizeRemovedCategories,
} from "../services/categoryService.js";
import { getMonthStatements } from "../services/statementService.js";
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
    categories: config.categories,
    ignore: config.ignore,
    rename: config.rename,
  }, origin);
}

async function handlePut(
  event: APIGatewayProxyEventV2,
  user: JWTPayload,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const body = JSON.parse(event.body || "{}");

  const { categories, ignore, rename } = body;
  if (!categories) {
    return respond(400, { error: "categories is required" }, origin);
  }

  const userRecord = await getUser(user.userId);
  const familyId = userRecord?.familyId;

  const previous = await getConfig(user.userId, familyId);
  const previousNames = Object.keys(previous.categories);
  const nextNames = new Set(Object.keys(categories));
  const removed = previousNames.filter((name) => !nextNames.has(name));

  const saved = await saveConfig(user.userId, familyId, {
    categories,
    ignore: ignore ?? [],
    rename: rename ?? {},
    updatedAt: "",
  });

  let recategorized = 0;
  if (removed.length > 0) {
    recategorized = await recategorizeRemovedCategories(
      user.userId,
      familyId,
      removed,
    );
  }

  return respond(200, {
    categories: saved.categories,
    ignore: saved.ignore,
    rename: saved.rename,
    removedCategories: removed,
    recategorized,
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

  const originalDesc = record.transactions[localIdx].originalDescription;

  if (shouldCreate && color) {
    await createCategoryEntry(user.userId, familyId, newCategory, color);
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

  if (applyToSimilar && originalDesc) {
    const [yearMonth] = statementId.split("#");
    const allRecords = await getMonthStatements(user.userId, yearMonth, familyId);
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
    await addKeywordToCategory(user.userId, familyId, newCategory, keyword);
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
  const originalDesc = tx.originalDescription;

  tx.payee = newPayeeName;
  await docClient.send(
    new PutCommand({ TableName: TABLE_NAME, Item: record }),
  );

  await addRenameMapping(user.userId, familyId, originalDesc, newPayeeName);

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

  await addIgnorePattern(user.userId, familyId, pattern);

  return respond(200, { message: "Ignored" }, origin);
}

async function handleHide(
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
  tx.hidden = !tx.hidden;

  let totalIn = 0;
  let totalOut = 0;
  const catMap = new Map<string, { category: string; total: number; count: number }>();
  for (const t of record.transactions) {
    if (!t.hidden) {
      if (t.amount >= 0) totalIn += t.amount;
      else totalOut += t.amount;
    }
    const existing = catMap.get(t.category);
    if (existing) {
      if (!t.hidden) existing.total += t.amount;
      existing.count += 1;
    } else {
      catMap.set(t.category, {
        category: t.category,
        total: t.hidden ? 0 : t.amount,
        count: 1,
      });
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

  return respond(200, { message: "Toggled", hidden: tx.hidden }, origin);
}

async function resolveTransaction(
  statementId: string,
  globalIndex: number,
  userId: string,
  familyId?: string,
): Promise<{ record: StatementRecord | null; localIdx: number }> {
  const [yearMonth] = statementId.split("#");
  if (!yearMonth) return { record: null, localIdx: 0 };

  const records = await getMonthStatements(userId, yearMonth, familyId);
  let idx = globalIndex;
  for (const r of records) {
    if (idx < r.transactions.length) {
      return { record: r, localIdx: idx };
    }
    idx -= r.transactions.length;
  }
  return { record: null, localIdx: 0 };
}

async function handleApply(
  event: APIGatewayProxyEventV2,
  user: JWTPayload,
): Promise<APIGatewayProxyResultV2> {
  const origin = event.headers?.origin;
  const body = JSON.parse(event.body || "{}");
  const { yearMonth } = body;

  if (!yearMonth) {
    return respond(400, { error: "yearMonth is required" }, origin);
  }

  const userRecord = await getUser(user.userId);
  const familyId = userRecord?.familyId;

  const changed = await applyCategoryConfig(user.userId, familyId, yearMonth);
  return respond(200, { message: "Applied", changed }, origin);
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
  if (method === "POST" && path === "/categories/hide") return handleHide(event, user);
  if (method === "POST" && path === "/categories/apply") return handleApply(event, user);

  return respond(404, { error: "Not found" }, origin);
}
