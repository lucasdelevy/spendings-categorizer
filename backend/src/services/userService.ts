import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "./dynamoClient.js";
import type { UserRecord } from "../types.js";

export async function getUser(userId: string): Promise<UserRecord | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: "PROFILE" },
    }),
  );
  return (result.Item as UserRecord) ?? null;
}

export async function upsertUser(params: {
  googleId: string;
  email: string;
  name: string;
  picture: string;
}): Promise<UserRecord> {
  const now = new Date().toISOString();

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${params.googleId}`, SK: "PROFILE" },
      UpdateExpression:
        "SET email = :email, #n = :name, picture = :picture, googleId = :gid, createdAt = if_not_exists(createdAt, :now)",
      ExpressionAttributeNames: { "#n": "name" },
      ExpressionAttributeValues: {
        ":email": params.email,
        ":name": params.name,
        ":picture": params.picture,
        ":gid": params.googleId,
        ":now": now,
      },
    }),
  );

  return (await getUser(params.googleId))!;
}
