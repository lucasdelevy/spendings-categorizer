import {
  BatchWriteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "./dynamoClient.js";
import type { FamilyMemberRecord, StatementRecord } from "../types.js";
import { getUser } from "./userService.js";
import {
  listMembers,
  promoteToOwner,
  removeMember,
} from "./familyService.js";

export function chooseFamilySuccessor(
  members: FamilyMemberRecord[],
  leavingUserId: string,
): FamilyMemberRecord | null {
  const candidates = members.filter(
    (m) =>
      m.status === "active" &&
      m.SK !== `MEMBER#${leavingUserId}` &&
      !m.SK.includes("pending-"),
  );
  return candidates.find((m) => m.role === "admin") ?? candidates[0] ?? null;
}

function memberUserId(member: FamilyMemberRecord): string {
  return member.SK.replace("MEMBER#", "");
}

async function queryAll(pk: string, skPrefix?: string): Promise<Record<string, unknown>[]> {
  const items: Record<string, unknown>[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: skPrefix
          ? "PK = :pk AND begins_with(SK, :sk)"
          : "PK = :pk",
        ExpressionAttributeValues: skPrefix
          ? { ":pk": pk, ":sk": skPrefix }
          : { ":pk": pk },
        ExclusiveStartKey,
      }),
    );
    items.push(...((result.Items as Record<string, unknown>[]) ?? []));
    ExclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (ExclusiveStartKey);
  return items;
}

async function deleteKeys(keys: { PK: string; SK: string }[]): Promise<void> {
  for (let i = 0; i < keys.length; i += 25) {
    const chunk = keys.slice(i, i + 25);
    let requestItems = chunk.map((Key) => ({ DeleteRequest: { Key } }));
    for (let attempt = 0; attempt < 4 && requestItems.length > 0; attempt++) {
      const result = await docClient.send(
        new BatchWriteCommand({
          RequestItems: { [TABLE_NAME]: requestItems },
        }),
      );
      const unprocessed = result.UnprocessedItems?.[TABLE_NAME] ?? [];
      requestItems = unprocessed as typeof requestItems;
    }
  }
}

async function deletePartition(pk: string): Promise<void> {
  const items = await queryAll(pk);
  await deleteKeys(
    items
      .filter((item) => typeof item.PK === "string" && typeof item.SK === "string")
      .map((item) => ({ PK: item.PK as string, SK: item.SK as string })),
  );
}

function isUsersStatement(item: Record<string, unknown>, userId: string): boolean {
  const txs = (item.transactions as StatementRecord["transactions"] | undefined) ?? [];
  if (txs.length === 0) return false;
  return txs.every((t) => !t.uploadedBy || t.uploadedBy.userId === userId);
}

async function deleteUsersFamilyUploads(familyId: string, userId: string): Promise<void> {
  const items = await queryAll(`FAMILY#${familyId}`, "STMT#");
  const keys = items
    .filter((item) => isUsersStatement(item, userId))
    .filter((item) => typeof item.PK === "string" && typeof item.SK === "string")
    .map((item) => ({ PK: item.PK as string, SK: item.SK as string }));
  await deleteKeys(keys);
}

async function leaveOrDissolveFamily(userId: string, email: string, familyId: string): Promise<void> {
  const members = await listMembers(familyId);
  const me = members.find((m) => m.SK === `MEMBER#${userId}`);
  const successor = chooseFamilySuccessor(members, userId);

  if (me?.role === "owner" && !successor) {
    for (const member of members) {
      if (member.email) await removeMember(familyId, member.email);
    }
    await deletePartition(`FAMILY#${familyId}`);
    return;
  }

  if (me?.role === "owner" && successor) {
    await promoteToOwner(familyId, memberUserId(successor));
  }

  await deleteUsersFamilyUploads(familyId, userId);
  if (email) {
    await removeMember(familyId, email);
    return;
  }
  await deleteKeys([{ PK: `FAMILY#${familyId}`, SK: `MEMBER#${userId}` }]);
}

/**
 * Permanently delete the signed-in user and their personal data.
 * Family groups with other active members are kept; the caller is removed
 * and a remaining member is promoted if they were the only owner.
 */
export async function deleteAccount(userId: string): Promise<void> {
  const user = await getUser(userId);
  if (!user) return;

  if (user.familyId) {
    await leaveOrDissolveFamily(userId, user.email, user.familyId);
  }

  const email = user.email?.trim().toLowerCase();
  const extraKeys = email
    ? [{ PK: `EMAILUSER#${email}`, SK: "LINK" }]
    : [];

  await deletePartition(`USER#${userId}`);
  if (extraKeys.length > 0) await deleteKeys(extraKeys);
}
