import { PutCommand, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "./dynamoClient.js";
import type { DeviceRecord } from "../types.js";

const TOKEN_RE = /^[A-Za-z0-9._\-\[\]+=]+$/;

export function normalizeDeviceToken(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const token = raw.trim();
  if (token.length < 16 || token.length > 512) return null;
  if (!TOKEN_RE.test(token)) return null;
  return token;
}

export async function upsertDevice(input: {
  userId: string;
  token: string;
  platform: "ios";
  locale: string;
}): Promise<DeviceRecord> {
  const record: DeviceRecord = {
    PK: `USER#${input.userId}`,
    SK: `DEVICE#${input.token}`,
    token: input.token,
    platform: input.platform,
    locale: input.locale || "en",
    updatedAt: new Date().toISOString(),
  };
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: record }));
  return record;
}

export async function deleteDevice(userId: string, token: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `DEVICE#${token}` },
    }),
  );
}

export async function listDevicesForUser(userId: string): Promise<DeviceRecord[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":prefix": "DEVICE#",
      },
    }),
  );
  return (result.Items as DeviceRecord[]) ?? [];
}

export async function listDevicesForUsers(userIds: string[]): Promise<DeviceRecord[]> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const nested = await Promise.all(unique.map((id) => listDevicesForUser(id)));
  return nested.flat();
}
