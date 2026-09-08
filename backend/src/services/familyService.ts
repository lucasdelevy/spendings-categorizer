import {
  BatchWriteCommand,
  PutCommand,
  GetCommand,
  DeleteCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import { docClient, TABLE_NAME } from "./dynamoClient.js";
import type {
  FamilyRecord,
  FamilyMemberRecord,
  FamilyMemberRole,
  EmailFamilyLookup,
} from "../types.js";

export async function createFamily(
  name: string,
  owner: { userId: string; email: string; name: string; picture: string },
): Promise<{ familyId: string; family: FamilyRecord }> {
  const familyId = ulid();
  const now = new Date().toISOString();

  const family: FamilyRecord = {
    PK: `FAMILY#${familyId}`,
    SK: "META",
    name,
    createdBy: owner.userId,
    createdAt: now,
  };

  const member: FamilyMemberRecord = {
    PK: `FAMILY#${familyId}`,
    SK: `MEMBER#${owner.userId}`,
    email: owner.email,
    name: owner.name,
    picture: owner.picture,
    role: "owner",
    status: "active",
    joinedAt: now,
  };

  const emailLookup: EmailFamilyLookup = {
    PK: `EMAILFAM#${owner.email}`,
    SK: "LINK",
    familyId,
  };

  await Promise.all([
    docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: family })),
    docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: member })),
    docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: emailLookup })),
  ]);

  return { familyId, family };
}

export async function getFamily(familyId: string): Promise<FamilyRecord | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `FAMILY#${familyId}`, SK: "META" },
    }),
  );
  return (result.Item as FamilyRecord) ?? null;
}

export async function listMembers(familyId: string): Promise<FamilyMemberRecord[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": `FAMILY#${familyId}`,
        ":prefix": "MEMBER#",
      },
    }),
  );
  return (result.Items as FamilyMemberRecord[]) ?? [];
}

export async function getMember(
  familyId: string,
  userId: string,
): Promise<FamilyMemberRecord | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `FAMILY#${familyId}`, SK: `MEMBER#${userId}` },
    }),
  );
  return (result.Item as FamilyMemberRecord) ?? null;
}

export async function setMemberRole(
  familyId: string,
  userId: string,
  role: FamilyMemberRole,
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `FAMILY#${familyId}`, SK: `MEMBER#${userId}` },
      UpdateExpression: "SET #r = :role",
      ExpressionAttributeNames: { "#r": "role" },
      ExpressionAttributeValues: { ":role": role },
    }),
  );
}

async function clearFamilyId(userId: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: "PROFILE" },
      UpdateExpression: "REMOVE familyId",
    }),
  );
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
  const items: Record<string, unknown>[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": pk },
        ExclusiveStartKey,
      }),
    );
    items.push(...((result.Items as Record<string, unknown>[]) ?? []));
    ExclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (ExclusiveStartKey);

  await deleteKeys(
    items
      .filter((item) => typeof item.PK === "string" && typeof item.SK === "string")
      .map((item) => ({ PK: item.PK as string, SK: item.SK as string })),
  );
}

export async function deleteFamily(familyId: string): Promise<void> {
  const members = await listMembers(familyId);
  await Promise.all(
    members.map(async (member) => {
      if (member.email) {
        await docClient.send(
          new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { PK: `EMAILFAM#${member.email}`, SK: "LINK" },
          }),
        );
      }
      if (member.status === "active" && !member.SK.includes("pending-")) {
        await clearFamilyId(member.SK.replace("MEMBER#", ""));
      }
    }),
  );
  await deletePartition(`FAMILY#${familyId}`);
}

export async function addMember(
  familyId: string,
  email: string,
): Promise<FamilyMemberRecord> {
  const now = new Date().toISOString();
  const tempId = `pending-${ulid()}`;

  const member: FamilyMemberRecord = {
    PK: `FAMILY#${familyId}`,
    SK: `MEMBER#${tempId}`,
    email,
    name: email,
    picture: "",
    role: "member",
    status: "pending",
    joinedAt: now,
  };

  const emailLookup: EmailFamilyLookup = {
    PK: `EMAILFAM#${email}`,
    SK: "LINK",
    familyId,
  };

  await Promise.all([
    docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: member })),
    docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: emailLookup })),
  ]);

  return member;
}

export async function removeMember(
  familyId: string,
  email: string,
): Promise<void> {
  const members = await listMembers(familyId);
  const member = members.find((m) => m.email === email);

  const deletes: Promise<unknown>[] = [
    docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK: `EMAILFAM#${email}`, SK: "LINK" },
      }),
    ),
  ];

  if (member) {
    deletes.push(
      docClient.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: { PK: `FAMILY#${familyId}`, SK: member.SK },
        }),
      ),
    );
    if (member.status === "active" && !member.SK.includes("pending-")) {
      deletes.push(clearFamilyId(member.SK.replace("MEMBER#", "")));
    }
  }

  await Promise.all(deletes);
}

export async function lookupFamilyByEmail(
  email: string,
): Promise<string | null> {
  const trimmed = email.trim();
  const candidates = [...new Set([trimmed, trimmed.toLowerCase()].filter(Boolean))];
  for (const candidate of candidates) {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: `EMAILFAM#${candidate}`, SK: "LINK" },
      }),
    );
    const record = result.Item as EmailFamilyLookup | undefined;
    if (record?.familyId) return record.familyId;
  }
  return null;
}

export async function removeMemberByUserId(
  familyId: string,
  userId: string,
): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: `FAMILY#${familyId}`, SK: `MEMBER#${userId}` },
    }),
  );
}

export async function activateMember(
  familyId: string,
  email: string,
  user: { userId: string; name: string; picture: string },
): Promise<void> {
  const members = await listMembers(familyId);
  const normalized = email.trim().toLowerCase();
  const alreadyActive = members.find(
    (m) =>
      m.status === "active" &&
      !m.SK.includes("pending-") &&
      m.email.trim().toLowerCase() === normalized,
  );
  if (alreadyActive) {
    return;
  }

  const pending = members.find(
    (m) => m.email.trim().toLowerCase() === normalized && m.status === "pending",
  );

  if (pending) {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK: `FAMILY#${familyId}`, SK: pending.SK },
      }),
    );
  }

  const now = new Date().toISOString();
  const activeMember: FamilyMemberRecord = {
    PK: `FAMILY#${familyId}`,
    SK: `MEMBER#${user.userId}`,
    email,
    name: user.name,
    picture: user.picture,
    role: "member",
    status: "active",
    joinedAt: now,
  };

  await docClient.send(
    new PutCommand({ TableName: TABLE_NAME, Item: activeMember }),
  );
}

export async function updateFamilyName(
  familyId: string,
  name: string,
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `FAMILY#${familyId}`, SK: "META" },
      UpdateExpression: "SET #n = :name",
      ExpressionAttributeNames: { "#n": "name" },
      ExpressionAttributeValues: { ":name": name },
    }),
  );
}

export async function promoteToOwner(familyId: string, userId: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `FAMILY#${familyId}`, SK: `MEMBER#${userId}` },
      UpdateExpression: "SET #r = :owner",
      ExpressionAttributeNames: { "#r": "role" },
      ExpressionAttributeValues: { ":owner": "owner" },
    }),
  );
}
