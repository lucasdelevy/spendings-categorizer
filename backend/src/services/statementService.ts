import { PutCommand, GetCommand, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "./dynamoClient.js";
import type { StatementRecord, StatementSummary, TransactionItem } from "../types.js";

export interface SaveStatementInput {
  userId: string;
  yearMonth: string; // YYYYMM
  type: "bank" | "card" | "family";
  fileName: string;
  summary: StatementSummary;
  transactions: TransactionItem[];
}

export async function saveStatement(input: SaveStatementInput): Promise<StatementRecord> {
  const record: StatementRecord = {
    PK: `USER#${input.userId}`,
    SK: `STMT#${input.yearMonth}#${input.type}`,
    fileName: input.fileName,
    uploadedAt: new Date().toISOString(),
    summary: input.summary,
    transactions: input.transactions,
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
): Promise<StatementRecord | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `STMT#${yearMonth}#${type}` },
    }),
  );
  return (result.Item as StatementRecord) ?? null;
}

export async function listStatements(userId: string): Promise<StatementRecord[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":prefix": "STMT#",
      },
    }),
  );
  return (result.Items as StatementRecord[]) ?? [];
}

export async function deleteStatement(
  userId: string,
  yearMonth: string,
  type: string,
): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `STMT#${yearMonth}#${type}` },
    }),
  );
}
