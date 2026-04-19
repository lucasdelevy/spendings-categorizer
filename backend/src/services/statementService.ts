import { PutCommand, GetCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "./dynamoClient.js";
import type { StatementRecord, StatementSummary, TransactionItem, UploadedBy } from "../types.js";

export interface SaveStatementInput {
  userId: string;
  familyId?: string;
  yearMonth: string;
  type: "bank" | "card" | "family";
  fileName: string;
  summary: StatementSummary;
  transactions: TransactionItem[];
  uploadedBy: UploadedBy;
}

export async function saveStatement(input: SaveStatementInput): Promise<StatementRecord> {
  const pk = input.familyId
    ? `FAMILY#${input.familyId}`
    : `USER#${input.userId}`;
  const sk = input.familyId
    ? `STMT#${input.yearMonth}#${input.userId}`
    : `STMT#${input.yearMonth}#${input.type}`;

  const transactions = input.transactions.map((t) => ({
    ...t,
    uploadedBy: input.uploadedBy,
  }));

  const record: StatementRecord = {
    PK: pk,
    SK: sk,
    fileName: input.fileName,
    uploadedAt: new Date().toISOString(),
    status: "active",
    summary: input.summary,
    transactions,
  };

  await docClient.send(
    new PutCommand({ TableName: TABLE_NAME, Item: record }),
  );

  return record;
}

export async function getStatement(
  userId: string,
  yearMonth: string,
  type: string,
  familyId?: string,
): Promise<StatementRecord | null> {
  if (familyId) {
    return getStatementByKey(
      `FAMILY#${familyId}`,
      `STMT#${yearMonth}#${userId}`,
    );
  }
  return getStatementByKey(
    `USER#${userId}`,
    `STMT#${yearMonth}#${type}`,
  );
}

async function getStatementByKey(pk: string, sk: string): Promise<StatementRecord | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk },
    }),
  );
  const record = result.Item as StatementRecord | undefined;
  if (!record || record.status === "overridden") return null;
  return record;
}

export async function getFamilyMonthStatements(
  familyId: string,
  yearMonth: string,
): Promise<StatementRecord[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      FilterExpression: "attribute_not_exists(#st) OR #st = :active",
      ExpressionAttributeNames: { "#st": "status" },
      ExpressionAttributeValues: {
        ":pk": `FAMILY#${familyId}`,
        ":prefix": `STMT#${yearMonth}#`,
        ":active": "active",
      },
    }),
  );
  return (result.Items as StatementRecord[]) ?? [];
}

export async function listStatements(userId: string, familyId?: string): Promise<StatementRecord[]> {
  const pk = familyId ? `FAMILY#${familyId}` : `USER#${userId}`;

  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      FilterExpression: "attribute_not_exists(#st) OR #st = :active",
      ExpressionAttributeNames: { "#st": "status" },
      ExpressionAttributeValues: {
        ":pk": pk,
        ":prefix": "STMT#",
        ":active": "active",
      },
    }),
  );
  return (result.Items as StatementRecord[]) ?? [];
}

export async function softDeleteStatement(
  userId: string,
  yearMonth: string,
  type: string,
  familyId?: string,
): Promise<void> {
  const pk = familyId ? `FAMILY#${familyId}` : `USER#${userId}`;
  const sk = familyId
    ? `STMT#${yearMonth}#${userId}`
    : `STMT#${yearMonth}#${type}`;

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk },
      UpdateExpression: "SET #st = :overridden",
      ExpressionAttributeNames: { "#st": "status" },
      ExpressionAttributeValues: { ":overridden": "overridden" },
    }),
  );
}

export async function softDeleteFamilyMonth(
  familyId: string,
  yearMonth: string,
): Promise<void> {
  const records = await getFamilyMonthStatements(familyId, yearMonth);
  await Promise.all(
    records.map((r) =>
      docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { PK: r.PK, SK: r.SK },
          UpdateExpression: "SET #st = :overridden",
          ExpressionAttributeNames: { "#st": "status" },
          ExpressionAttributeValues: { ":overridden": "overridden" },
        }),
      ),
    ),
  );
}
