import { PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "./dynamoClient.js";
import { buildDefaultConfig } from "../defaults/categories.js";
import type { CategoryConfigRecord, CategoryEntry, StatementRecord, TransactionItem } from "../types.js";
import { getMonthStatements } from "./statementService.js";
import { isRefund } from "./refunds.js";

function pk(userId: string, familyId?: string): string {
  return familyId ? `FAMILY#${familyId}` : `USER#${userId}`;
}

interface LegacyConfigRecord {
  PK: string;
  SK: "CATCONFIG";
  bankCategories?: Record<string, CategoryEntry>;
  cardCategories?: Record<string, CategoryEntry>;
  bankIgnore?: string[];
  cardIgnore?: string[];
  bankRename?: Record<string, string>;
  cardRename?: Record<string, string>;
  categories?: Record<string, CategoryEntry>;
  ignore?: string[];
  rename?: Record<string, string>;
  updatedAt: string;
}

function migrateRecord(raw: LegacyConfigRecord): Omit<CategoryConfigRecord, "PK" | "SK"> {
  if (raw.categories) {
    return {
      categories: raw.categories,
      ignore: raw.ignore ?? [],
      rename: raw.rename ?? {},
      updatedAt: raw.updatedAt,
    };
  }

  const merged: Record<string, CategoryEntry> = { ...(raw.bankCategories ?? {}), ...(raw.cardCategories ?? {}) };
  for (const [name, entry] of Object.entries(raw.bankCategories ?? {})) {
    if (merged[name] && raw.cardCategories?.[name]) {
      const combined = new Set([...entry.keywords, ...raw.cardCategories[name].keywords]);
      merged[name] = { keywords: Array.from(combined), color: entry.color };
    }
  }

  const ignoreSet = new Set([...(raw.bankIgnore ?? []), ...(raw.cardIgnore ?? [])]);
  const renameMap = { ...(raw.bankRename ?? {}), ...(raw.cardRename ?? {}) };

  return {
    categories: merged,
    ignore: Array.from(ignoreSet),
    rename: renameMap,
    updatedAt: raw.updatedAt,
  };
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

  if (result.Item) {
    const raw = result.Item as LegacyConfigRecord;
    if (raw.bankCategories && !raw.categories) {
      const migrated = migrateRecord(raw);
      return saveConfig(userId, familyId, migrated);
    }
    return result.Item as CategoryConfigRecord;
  }

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
  categoryName: string,
  keyword: string,
): Promise<void> {
  const config = await getConfig(userId, familyId);
  const entry = config.categories[categoryName];
  if (!entry) return;

  const lower = keyword.toLowerCase();

  let changed = false;
  for (const [name, cat] of Object.entries(config.categories)) {
    if (name === categoryName) continue;
    const idx = cat.keywords.indexOf(lower);
    if (idx !== -1) {
      cat.keywords.splice(idx, 1);
      changed = true;
    }
  }

  if (!entry.keywords.includes(lower)) {
    entry.keywords.push(lower);
    changed = true;
  }

  if (!changed) return;

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk(userId, familyId), SK: "CATCONFIG" },
      UpdateExpression: "SET categories = :val, updatedAt = :now",
      ExpressionAttributeValues: {
        ":val": config.categories,
        ":now": new Date().toISOString(),
      },
    }),
  );
}

export async function addRenameMapping(
  userId: string,
  familyId: string | undefined,
  raw: string,
  display: string,
): Promise<void> {
  const config = await getConfig(userId, familyId);
  config.rename[raw.toLowerCase()] = display;

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk(userId, familyId), SK: "CATCONFIG" },
      UpdateExpression: "SET rename = :val, updatedAt = :now",
      ExpressionAttributeValues: {
        ":val": config.rename,
        ":now": new Date().toISOString(),
      },
    }),
  );
}

export async function addIgnorePattern(
  userId: string,
  familyId: string | undefined,
  pattern: string,
): Promise<void> {
  const config = await getConfig(userId, familyId);
  const lower = pattern.toLowerCase();
  if (config.ignore.includes(lower)) return;
  config.ignore.push(lower);

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk(userId, familyId), SK: "CATCONFIG" },
      UpdateExpression: "SET ignore = :val, updatedAt = :now",
      ExpressionAttributeValues: {
        ":val": config.ignore,
        ":now": new Date().toISOString(),
      },
    }),
  );
}

export async function createCategoryEntry(
  userId: string,
  familyId: string | undefined,
  name: string,
  color: string,
): Promise<void> {
  const config = await getConfig(userId, familyId);
  if (config.categories[name]) return;
  config.categories[name] = { keywords: [], color };

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk(userId, familyId), SK: "CATCONFIG" },
      UpdateExpression: "SET categories = :val, updatedAt = :now",
      ExpressionAttributeValues: {
        ":val": config.categories,
        ":now": new Date().toISOString(),
      },
    }),
  );
}

function categorizeTransaction(
  tx: TransactionItem,
  config: CategoryConfigRecord,
): string {
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

  return bestCategory || tx.category;
}

export async function applyCategoryConfig(
  userId: string,
  familyId: string | undefined,
  yearMonth: string,
): Promise<number> {
  const config = await getConfig(userId, familyId);

  const records = await getMonthStatements(userId, yearMonth, familyId);

  let totalChanged = 0;

  for (const record of records) {
    let changed = false;
    let summaryDirty = false;
    for (const tx of record.transactions) {
      const newCat = categorizeTransaction(tx, config);
      if (newCat !== tx.category) {
        tx.category = newCat;
        changed = true;
        totalChanged++;
      }
      // Heal historic refund rows whose amount was stored with the wrong
      // sign before the estorno fix shipped.
      if (isRefund(tx.originalDescription) && tx.amount < 0) {
        tx.amount = Math.abs(tx.amount);
        changed = true;
        summaryDirty = true;
        totalChanged++;
      }
    }
    if (summaryDirty) {
      record.summary = recomputeSummary(record);
    }
    if (changed) {
      await docClient.send(
        new PutCommand({ TableName: TABLE_NAME, Item: record }),
      );
    }
  }

  return totalChanged;
}

function recomputeSummary(record: StatementRecord): StatementRecord["summary"] {
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
      if (!t.hidden) {
        existing.total += t.amount;
        existing.count += 1;
      }
    } else {
      catMap.set(t.category, {
        category: t.category,
        total: t.hidden ? 0 : t.amount,
        count: t.hidden ? 0 : 1,
      });
    }
  }
  return {
    ...record.summary,
    totalIn,
    totalOut,
    balance: totalIn + totalOut,
    categories: Array.from(catMap.values()),
  };
}

async function seedDefaults(
  userId: string,
  familyId?: string,
): Promise<CategoryConfigRecord> {
  const defaults = buildDefaultConfig();
  return saveConfig(userId, familyId, defaults);
}
