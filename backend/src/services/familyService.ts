import {
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
  }

  await Promise.all(deletes);
}

export async function lookupFamilyByEmail(
  email: string,
): Promise<string | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `EMAILFAM#${email}`, SK: "LINK" },
    }),
  );
  const record = result.Item as EmailFamilyLookup | undefined;
  return record?.familyId ?? null;
}

export async function activateMember(
  familyId: string,
  email: string,
  user: { userId: string; name: string; picture: string },
): Promise<void> {
  const members = await listMembers(familyId);
  const pending = members.find(
    (m) => m.email === email && m.status === "pending",
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
