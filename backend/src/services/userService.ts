import {
  BatchWriteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { familyEmailMatches, pickCanonicalUserId } from "./accountLinking.js";
import { docClient, TABLE_NAME } from "./dynamoClient.js";
import { listMembers, lookupFamilyByEmail, removeMemberByUserId } from "./familyService.js";
import type { EmailUserLookup, UserRecord } from "../types.js";

export async function getUser(userId: string): Promise<UserRecord | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: "PROFILE" },
    }),
  );
  return (result.Item as UserRecord) ?? null;
}

export async function lookupUserByEmail(email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `EMAILUSER#${normalized}`, SK: "LINK" },
    }),
  );
  return (result.Item as EmailUserLookup | undefined)?.userId ?? null;
}

async function findProfilesByEmail(email: string): Promise<{ userId: string; createdAt: string }[]> {
  const normalized = email.trim().toLowerCase();
  const matches: { userId: string; createdAt: string }[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "SK = :sk",
        ExpressionAttributeValues: { ":sk": "PROFILE" },
        ProjectionExpression: "PK, email, createdAt",
        ExclusiveStartKey,
      }),
    );
    for (const item of result.Items ?? []) {
      const pk = typeof item.PK === "string" ? item.PK : "";
      const itemEmail = typeof item.email === "string" ? item.email.trim().toLowerCase() : "";
      if (!pk.startsWith("USER#") || itemEmail !== normalized) continue;
      matches.push({
        userId: pk.slice("USER#".length),
        createdAt: typeof item.createdAt === "string" ? item.createdAt : "",
      });
    }
    ExclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (ExclusiveStartKey);
  return matches;
}

async function deleteUserPartition(userId: string): Promise<void> {
  const keys: { PK: string; SK: string }[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": `USER#${userId}` },
        ExclusiveStartKey,
      }),
    );
    for (const item of result.Items ?? []) {
      if (typeof item.PK === "string" && typeof item.SK === "string") {
        keys.push({ PK: item.PK, SK: item.SK });
      }
    }
    ExclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (ExclusiveStartKey);

  for (let i = 0; i < keys.length; i += 25) {
    const chunk = keys.slice(i, i + 25);
    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: chunk.map((Key) => ({ DeleteRequest: { Key } })),
        },
      }),
    );
  }
}

async function mergeDuplicateUser(canonicalId: string, duplicateId: string): Promise<void> {
  if (!canonicalId || !duplicateId || canonicalId === duplicateId) return;

  const [canonical, duplicate] = await Promise.all([getUser(canonicalId), getUser(duplicateId)]);
  if (duplicate) {
    await upsertUser({
      userId: canonicalId,
      email: canonical?.email || duplicate.email || "",
      name: canonical?.name || duplicate.name || "",
      picture: canonical?.picture || duplicate.picture || "",
      googleId: canonical?.googleId || duplicate.googleId,
      appleId: canonical?.appleId || duplicate.appleId,
    });
    if (duplicate.familyId) {
      await removeMemberByUserId(duplicate.familyId, duplicateId);
    } else if (canonical?.familyId) {
      await removeMemberByUserId(canonical.familyId, duplicateId);
    }
    await deleteUserPartition(duplicateId);
    return;
  }

  const familyId = canonical?.familyId;
  if (familyId) await removeMemberByUserId(familyId, duplicateId);
}

export async function resolveUserId(oauthSub: string, email?: string): Promise<string> {
  const normalized = email?.trim().toLowerCase() || "";
  const emailLinkUserId = normalized ? await lookupUserByEmail(normalized) : null;
  const familyId = normalized ? await lookupFamilyByEmail(normalized) : null;
  const members = familyId ? await listMembers(familyId) : [];
  const familyMatches = normalized ? familyEmailMatches(members, normalized) : [];

  const needsScan =
    Boolean(normalized) && familyMatches.length === 0 && !emailLinkUserId && !(await getUser(oauthSub));
  const scannedProfiles = needsScan ? await findProfilesByEmail(normalized) : [];

  const { canonicalId, duplicateIds } = pickCanonicalUserId({
    oauthSub,
    emailLinkUserId,
    scannedProfiles,
    familyMatches,
  });

  for (const duplicateId of duplicateIds) {
    await mergeDuplicateUser(canonicalId, duplicateId);
  }
  return canonicalId;
}

export async function upsertUser(params: {
  userId: string;
  email: string;
  name: string;
  picture: string;
  googleId?: string;
  appleId?: string;
}): Promise<UserRecord> {
  const now = new Date().toISOString();
  const sets = ["createdAt = if_not_exists(createdAt, :now)"];
  const names: Record<string, string> = {};
  const values: Record<string, string> = { ":now": now };

  if (params.email) {
    sets.push("email = :email");
    values[":email"] = params.email;
  }
  if (params.name) {
    sets.push("#n = :name");
    names["#n"] = "name";
    values[":name"] = params.name;
  }
  if (params.picture) {
    sets.push("picture = :picture");
    values[":picture"] = params.picture;
  }
  if (params.googleId) {
    sets.push("googleId = :gid");
    values[":gid"] = params.googleId;
  }
  if (params.appleId) {
    sets.push("appleId = :aid");
    values[":aid"] = params.appleId;
  }

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${params.userId}`, SK: "PROFILE" },
      UpdateExpression: `SET ${sets.join(", ")}`,
      ...(Object.keys(names).length > 0 ? { ExpressionAttributeNames: names } : {}),
      ExpressionAttributeValues: values,
    }),
  );

  const email = params.email.trim().toLowerCase();
  if (email) {
    const link: EmailUserLookup = {
      PK: `EMAILUSER#${email}`,
      SK: "LINK",
      userId: params.userId,
    };
    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: link }));
  }

  return (await getUser(params.userId))!;
}

export async function setReminderNotifyTime(
  userId: string,
  notifyTime: string,
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: "PROFILE" },
      UpdateExpression: "SET reminderNotifyTime = :t",
      ExpressionAttributeValues: { ":t": notifyTime },
    }),
  );
}

export async function setFamilyId(
  userId: string,
  familyId: string,
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: "PROFILE" },
      UpdateExpression: "SET familyId = :fid",
      ExpressionAttributeValues: { ":fid": familyId },
    }),
  );
}
