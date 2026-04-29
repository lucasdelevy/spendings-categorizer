import {
  PutCommand,
  GetCommand,
  DeleteCommand,
  QueryCommand,
  UpdateCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import * as crypto from "crypto";
import { docClient, TABLE_NAME } from "./dynamoClient.js";
import type { AccountRecord, AccountType } from "../types.js";

const ACCOUNT_KEY_SECRET = process.env.ACCOUNT_KEY_SECRET || "";

function getEncryptionKey(): Buffer {
  if (!ACCOUNT_KEY_SECRET) {
    throw new Error("ACCOUNT_KEY_SECRET env var is not set");
  }
  let key: Buffer;
  try {
    key = Buffer.from(ACCOUNT_KEY_SECRET, "base64");
  } catch {
    throw new Error("ACCOUNT_KEY_SECRET must be base64-encoded");
  }
  if (key.length !== 32) {
    const sha = crypto.createHash("sha256");
    sha.update(ACCOUNT_KEY_SECRET);
    key = sha.digest();
  }
  return key;
}

export function encryptApiKey(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

export function decryptApiKey(token: string): string {
  const parts = token.split(":");
  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Unexpected encrypted api key format");
  }
  const key = getEncryptionKey();
  const iv = Buffer.from(parts[1], "base64");
  const tag = Buffer.from(parts[2], "base64");
  const ct = Buffer.from(parts[3], "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

export function buildApiKeyHint(plaintext: string): string {
  if (!plaintext) return "";
  const trimmed = plaintext.trim();
  if (trimmed.length <= 4) return `••${trimmed}`;
  return `••${trimmed.slice(-4)}`;
}

function ownerPK(userId: string, familyId?: string): string {
  return familyId ? `FAMILY#${familyId}` : `USER#${userId}`;
}

function accountSK(accountId: string): string {
  return `ACCT#${accountId}`;
}

export interface CreateAccountInput {
  userId: string;
  familyId?: string;
  name: string;
  type: AccountType;
  closingDay?: number;
  apiKey?: string;
}

export interface UpdateAccountInput {
  name?: string;
  closingDay?: number | null;
  apiKey?: string | null;
}

function normalizeDay(value: number | undefined | null, fallback?: number): number | undefined {
  if (value === null) return undefined;
  if (value === undefined) return fallback;
  if (!Number.isFinite(value)) return fallback;
  const rounded = Math.round(value);
  if (rounded < 1) return 1;
  if (rounded > 31) return 31;
  return rounded;
}

export async function createAccount(input: CreateAccountInput): Promise<AccountRecord> {
  const accountId = ulid();
  const now = new Date().toISOString();
  const closingDay = input.type === "card" ? normalizeDay(input.closingDay, 30) : undefined;

  const record: AccountRecord = {
    PK: ownerPK(input.userId, input.familyId),
    SK: accountSK(accountId),
    accountId,
    name: input.name,
    type: input.type,
    closingDay,
    createdBy: input.userId,
    createdAt: now,
    updatedAt: now,
  };

  if (input.apiKey && input.apiKey.trim()) {
    const trimmed = input.apiKey.trim();
    record.apiKeyEncrypted = encryptApiKey(trimmed);
    record.apiKeyHint = buildApiKeyHint(trimmed);
  }

  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: record }));
  return record;
}

export async function listAccounts(
  userId: string,
  familyId?: string,
): Promise<AccountRecord[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": ownerPK(userId, familyId),
        ":prefix": "ACCT#",
      },
    }),
  );
  return (result.Items as AccountRecord[]) ?? [];
}

export async function getAccount(
  userId: string,
  familyId: string | undefined,
  accountId: string,
): Promise<AccountRecord | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: ownerPK(userId, familyId), SK: accountSK(accountId) },
    }),
  );
  return (result.Item as AccountRecord | undefined) ?? null;
}

export async function updateAccount(
  userId: string,
  familyId: string | undefined,
  accountId: string,
  update: UpdateAccountInput,
): Promise<AccountRecord | null> {
  const existing = await getAccount(userId, familyId, accountId);
  if (!existing) return null;

  const sets: string[] = ["updatedAt = :now"];
  const removes: string[] = [];
  const values: Record<string, unknown> = { ":now": new Date().toISOString() };
  const names: Record<string, string> = {};

  if (update.name !== undefined) {
    sets.push("#n = :name");
    names["#n"] = "name";
    values[":name"] = update.name;
  }

  if (existing.type === "card") {
    if (update.closingDay !== undefined) {
      const normalized = normalizeDay(update.closingDay, existing.closingDay);
      if (normalized === undefined) {
        removes.push("closingDay");
      } else {
        sets.push("closingDay = :cd");
        values[":cd"] = normalized;
      }
    }
  }

  if (update.apiKey !== undefined) {
    if (update.apiKey === null || update.apiKey.trim() === "") {
      removes.push("apiKeyEncrypted");
      removes.push("apiKeyHint");
    } else {
      const trimmed = update.apiKey.trim();
      sets.push("apiKeyEncrypted = :enc");
      sets.push("apiKeyHint = :hint");
      values[":enc"] = encryptApiKey(trimmed);
      values[":hint"] = buildApiKeyHint(trimmed);
    }
  }

  let expr = `SET ${sets.join(", ")}`;
  if (removes.length > 0) {
    expr += ` REMOVE ${removes.join(", ")}`;
  }

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: ownerPK(userId, familyId), SK: accountSK(accountId) },
      UpdateExpression: expr,
      ExpressionAttributeValues: values,
      ExpressionAttributeNames: Object.keys(names).length > 0 ? names : undefined,
    }),
  );

  return getAccount(userId, familyId, accountId);
}

export interface AccountOwner {
  userId: string;
  familyId?: string;
}

/**
 * Find every distinct owner that has at least one account with an Open Finance
 * API key. We scan because the only way to discover owners without a known
 * `userId` is to walk the table; in practice the row count is small (one
 * record per registered account), so a paginated scan with a server-side
 * filter is cheap. The familyId resolution is intentionally deferred to the
 * caller to avoid coupling this service to the user table.
 */
export async function listOwnersWithApiKeys(): Promise<AccountOwner[]> {
  const seen = new Set<string>();
  const owners: AccountOwner[] = [];
  let exclusiveStartKey: Record<string, unknown> | undefined;

  do {
    const result: { Items?: Record<string, unknown>[]; LastEvaluatedKey?: Record<string, unknown> } =
      await docClient.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          ProjectionExpression: "PK",
          FilterExpression:
            "begins_with(SK, :prefix) AND attribute_exists(apiKeyEncrypted)",
          ExpressionAttributeValues: { ":prefix": "ACCT#" },
          ExclusiveStartKey: exclusiveStartKey,
        }),
      );

    for (const item of result.Items ?? []) {
      const pk = typeof item.PK === "string" ? item.PK : "";
      if (!pk || seen.has(pk)) continue;
      seen.add(pk);

      if (pk.startsWith("USER#")) {
        owners.push({ userId: pk.slice("USER#".length) });
      } else if (pk.startsWith("FAMILY#")) {
        // We can't resolve a familyId back to a single owning user without
        // looking up family member records, so we surface the familyId and
        // let the caller pick the right user record.
        owners.push({ userId: "", familyId: pk.slice("FAMILY#".length) });
      }
    }

    exclusiveStartKey = result.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return owners;
}

export async function deleteAccount(
  userId: string,
  familyId: string | undefined,
  accountId: string,
): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: ownerPK(userId, familyId), SK: accountSK(accountId) },
    }),
  );
}

export interface PublicAccount {
  accountId: string;
  name: string;
  type: AccountType;
  closingDay?: number;
  hasApiKey: boolean;
  apiKeyHint?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export function toPublicAccount(record: AccountRecord): PublicAccount {
  return {
    accountId: record.accountId,
    name: record.name,
    type: record.type,
    closingDay: record.closingDay,
    hasApiKey: !!record.apiKeyEncrypted,
    apiKeyHint: record.apiKeyHint,
    createdBy: record.createdBy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * Compute the billing month a card transaction belongs to based on the
 * card's closing day. Transactions on or before the closing day belong to
 * the same month's bill; later transactions roll into the next month.
 *
 * The billingMonth string follows YYYYMM. For non-card accounts (or when no
 * closing day is set) we fall back to the calendar month of the transaction.
 */
export function computeBillingMonth(
  txDate: string,
  type: AccountType | undefined,
  closingDay: number | undefined,
): string {
  const parsed = parseTxDate(txDate);
  if (!parsed) return "";

  const { year, month, day } = parsed;
  if (type !== "card" || !closingDay) {
    return `${year}${String(month).padStart(2, "0")}`;
  }

  if (day <= closingDay) {
    return `${year}${String(month).padStart(2, "0")}`;
  }

  let nextMonth = month + 1;
  let nextYear = year;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }
  return `${nextYear}${String(nextMonth).padStart(2, "0")}`;
}

function parseTxDate(raw: string): { year: number; month: number; day: number } | null {
  if (!raw) return null;
  if (raw.includes("T")) {
    const [datePart] = raw.split("T");
    return parseTxDate(datePart);
  }
  if (raw.includes("-")) {
    const [y, m, d] = raw.split("-");
    if (!y || !m || !d) return null;
    return { year: parseInt(y, 10), month: parseInt(m, 10), day: parseInt(d, 10) };
  }
  if (raw.includes("/")) {
    const [d, m, y] = raw.split("/");
    if (!y || !m || !d) return null;
    return { year: parseInt(y, 10), month: parseInt(m, 10), day: parseInt(d, 10) };
  }
  return null;
}
