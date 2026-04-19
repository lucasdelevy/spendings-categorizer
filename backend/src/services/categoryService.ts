import { PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "./dynamoClient.js";
import { buildDefaultConfig } from "../defaults/categories.js";
import type { CategoryConfigRecord } from "../types.js";

function pk(userId: string, familyId?: string): string {
  return familyId ? `FAMILY#${familyId}` : `USER#${userId}`;
}

export async function getConfig(
  userId: string,
  familyId?: string,
): Promise<CategoryConfigRecord> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk(userId, familyId), SK: "CATCONFIG" },
    }),
  );

  if (result.Item) return result.Item as CategoryConfigRecord;

  return seedDefaults(userId, familyId);
}

export async function saveConfig(
  userId: string,
  familyId: string | undefined,
  config: Omit<CategoryConfigRecord, "PK" | "SK">,
): Promise<CategoryConfigRecord> {
  const record: CategoryConfigRecord = {
    PK: pk(userId, familyId),
    SK: "CATCONFIG",
    ...config,
    updatedAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({ TableName: TABLE_NAME, Item: record }),
  );

  return record;
}

export async function addKeywordToCategory(
  userId: string,
  familyId: string | undefined,
  source: "bank" | "card",
  categoryName: string,
  keyword: string,
): Promise<void> {
  const config = await getConfig(userId, familyId);
  const bucket = source === "bank" ? config.bankCategories : config.cardCategories;

  const entry = bucket[categoryName];
  if (!entry) return;

  const lower = keyword.toLowerCase();
  if (entry.keywords.includes(lower)) return;

  entry.keywords.push(lower);

  const field = source === "bank" ? "bankCategories" : "cardCategories";
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk(userId, familyId), SK: "CATCONFIG" },
      UpdateExpression: "SET #field = :val, updatedAt = :now",
      ExpressionAttributeNames: { "#field": field },
      ExpressionAttributeValues: {
        ":val": bucket,
        ":now": new Date().toISOString(),
      },
    }),
  );
}

export async function addRenameMapping(
  userId: string,
  familyId: string | undefined,
  source: "bank" | "card",
  raw: string,
  display: string,
): Promise<void> {
  const config = await getConfig(userId, familyId);
  const map = source === "bank" ? config.bankRename : config.cardRename;
  map[raw.toLowerCase()] = display;

  const field = source === "bank" ? "bankRename" : "cardRename";
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk(userId, familyId), SK: "CATCONFIG" },
      UpdateExpression: "SET #field = :val, updatedAt = :now",
      ExpressionAttributeNames: { "#field": field },
      ExpressionAttributeValues: {
        ":val": map,
        ":now": new Date().toISOString(),
      },
    }),
  );
}

export async function addIgnorePattern(
  userId: string,
  familyId: string | undefined,
  source: "bank" | "card",
  pattern: string,
): Promise<void> {
  const config = await getConfig(userId, familyId);
  const list = source === "bank" ? config.bankIgnore : config.cardIgnore;
  const lower = pattern.toLowerCase();
  if (list.includes(lower)) return;
  list.push(lower);

  const field = source === "bank" ? "bankIgnore" : "cardIgnore";
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk(userId, familyId), SK: "CATCONFIG" },
      UpdateExpression: "SET #field = :val, updatedAt = :now",
      ExpressionAttributeNames: { "#field": field },
      ExpressionAttributeValues: {
        ":val": list,
        ":now": new Date().toISOString(),
      },
    }),
  );
}

export async function createCategoryEntry(
  userId: string,
  familyId: string | undefined,
  source: "bank" | "card",
  name: string,
  color: string,
): Promise<void> {
  const config = await getConfig(userId, familyId);
  const bucket = source === "bank" ? config.bankCategories : config.cardCategories;
  if (bucket[name]) return;
  bucket[name] = { keywords: [], color };

  const field = source === "bank" ? "bankCategories" : "cardCategories";
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk(userId, familyId), SK: "CATCONFIG" },
      UpdateExpression: "SET #field = :val, updatedAt = :now",
      ExpressionAttributeNames: { "#field": field },
      ExpressionAttributeValues: {
        ":val": bucket,
        ":now": new Date().toISOString(),
      },
    }),
  );
}

async function seedDefaults(
  userId: string,
  familyId?: string,
): Promise<CategoryConfigRecord> {
  const defaults = buildDefaultConfig();
  return saveConfig(userId, familyId, defaults);
}
