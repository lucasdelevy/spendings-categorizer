import { PutCommand, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import { docClient, TABLE_NAME } from "./dynamoClient.js";
import type { SessionRecord } from "../types.js";

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export async function createSession(userId: string): Promise<SessionRecord> {
  const sessionId = ulid();
  const now = new Date();
  const expiresAt = Math.floor(now.getTime() / 1000) + SESSION_TTL_SECONDS;

  const record: SessionRecord = {
    PK: `USER#${userId}`,
    SK: `SESS#${sessionId}`,
    expiresAt,
    createdAt: now.toISOString(),
  };

  await docClient.send(
    new PutCommand({ TableName: TABLE_NAME, Item: record }),
  );

  return record;
}

export async function getSession(
  userId: string,
  sessionId: string,
): Promise<SessionRecord | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `SESS#${sessionId}` },
    }),
  );

  const session = result.Item as SessionRecord | undefined;
  if (!session) return null;

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (session.expiresAt < nowSeconds) return null;

  return session;
}

export async function deleteSession(userId: string, sessionId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `SESS#${sessionId}` },
    }),
  );
}
