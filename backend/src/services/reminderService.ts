import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import { docClient, TABLE_NAME } from "./dynamoClient.js";
import type {
  ReminderOccurrenceRecord,
  ReminderPushRecord,
  ReminderRecord,
} from "../types.js";

export const DEFAULT_NOTIFY_TIME = "09:00";
export const REMINDER_TZ = "America/Sao_Paulo";
const HISTORY_MONTHS = 12;
const NAME_MAX = 80;

function ownerPK(userId: string, familyId?: string): string {
  return familyId ? `FAMILY#${familyId}` : `USER#${userId}`;
}

function reminderSK(reminderId: string): string {
  return `REMINDER#${reminderId}`;
}

function occurrenceSK(yearMonth: string, reminderId: string): string {
  return `REMINDEROCC#${yearMonth}#${reminderId}`;
}

function pushSK(yearMonth: string, reminderId: string, userId: string): string {
  return `REMINDERPUSH#${yearMonth}#${reminderId}#${userId}`;
}

export function normalizeDayOfMonth(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < 1 || rounded > 31) return null;
  return rounded;
}

export function parseNotifyTime(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const match = raw.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function normalizeReminderName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  if (!name || name.length > NAME_MAX) return null;
  return name;
}

export function shiftYearMonth(yearMonth: string, delta: number): string {
  const year = parseInt(yearMonth.slice(0, 4), 10);
  const month = parseInt(yearMonth.slice(4, 6), 10);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthsBack(from: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => shiftYearMonth(from, -i));
}

export function dueDayInMonth(dayOfMonth: number, yearMonth: string): number {
  const year = parseInt(yearMonth.slice(0, 4), 10);
  const month = parseInt(yearMonth.slice(4, 6), 10);
  const daysInMonth = new Date(year, month, 0).getDate();
  return Math.min(dayOfMonth, daysInMonth);
}

export function isDueOnDay(dayOfMonth: number, yearMonth: string, day: number): boolean {
  return dueDayInMonth(dayOfMonth, yearMonth) === day;
}

export function isAtOrAfterNotifyTime(notifyTime: string, hour: number, minute: number): boolean {
  const parsed = parseNotifyTime(notifyTime) ?? DEFAULT_NOTIFY_TIME;
  const [hours, minutes] = parsed.split(":").map(Number);
  return hour > hours || (hour === hours && minute >= minutes);
}

export function saoPauloParts(now = new Date()): {
  yearMonth: string;
  day: number;
  hour: number;
  minute: number;
} {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: REMINDER_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    yearMonth: `${get("year")}${get("month")}`,
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

export async function createReminder(input: {
  userId: string;
  familyId?: string;
  name: string;
  dayOfMonth: number;
}): Promise<ReminderRecord> {
  const reminderId = ulid();
  const now = new Date().toISOString();
  const record: ReminderRecord = {
    PK: ownerPK(input.userId, input.familyId),
    SK: reminderSK(reminderId),
    reminderId,
    name: input.name,
    dayOfMonth: input.dayOfMonth,
    createdBy: input.userId,
    createdAt: now,
    updatedAt: now,
  };
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: record }));
  return record;
}

export async function listReminders(
  userId: string,
  familyId?: string,
): Promise<ReminderRecord[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": ownerPK(userId, familyId),
        ":prefix": "REMINDER#",
      },
    }),
  );
  return ((result.Items as ReminderRecord[]) ?? []).sort((a, b) =>
    a.dayOfMonth === b.dayOfMonth ? a.name.localeCompare(b.name) : a.dayOfMonth - b.dayOfMonth,
  );
}

export async function getReminder(
  userId: string,
  familyId: string | undefined,
  reminderId: string,
): Promise<ReminderRecord | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: ownerPK(userId, familyId), SK: reminderSK(reminderId) },
      ConsistentRead: true,
    }),
  );
  return (result.Item as ReminderRecord | undefined) ?? null;
}

export async function updateReminder(
  userId: string,
  familyId: string | undefined,
  reminderId: string,
  update: { name?: string; dayOfMonth?: number },
): Promise<ReminderRecord | null> {
  const existing = await getReminder(userId, familyId, reminderId);
  if (!existing) return null;

  const sets = ["updatedAt = :now"];
  const values: Record<string, unknown> = { ":now": new Date().toISOString() };
  const names: Record<string, string> = {};

  if (update.name !== undefined) {
    sets.push("#n = :name");
    names["#n"] = "name";
    values[":name"] = update.name;
  }
  if (update.dayOfMonth !== undefined) {
    sets.push("dayOfMonth = :day");
    values[":day"] = update.dayOfMonth;
  }

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: existing.PK, SK: existing.SK },
      UpdateExpression: `SET ${sets.join(", ")}`,
      ...(Object.keys(names).length > 0 ? { ExpressionAttributeNames: names } : {}),
      ExpressionAttributeValues: values,
    }),
  );
  return getReminder(userId, familyId, reminderId);
}

export async function listOccurrences(
  userId: string,
  familyId?: string,
): Promise<ReminderOccurrenceRecord[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": ownerPK(userId, familyId),
        ":prefix": "REMINDEROCC#",
      },
    }),
  );
  return (result.Items as ReminderOccurrenceRecord[]) ?? [];
}

export async function getOccurrence(
  pk: string,
  yearMonth: string,
  reminderId: string,
): Promise<ReminderOccurrenceRecord | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: occurrenceSK(yearMonth, reminderId) },
    }),
  );
  return (result.Item as ReminderOccurrenceRecord | undefined) ?? null;
}

export async function setReminderPaid(input: {
  userId: string;
  familyId?: string;
  reminderId: string;
  yearMonth: string;
  paid: boolean;
  paidByName: string;
}): Promise<ReminderOccurrenceRecord | null> {
  const existing = await getReminder(input.userId, input.familyId, input.reminderId);
  if (!existing) return null;

  const key = { PK: existing.PK, SK: occurrenceSK(input.yearMonth, input.reminderId) };
  if (!input.paid) {
    await docClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: key }));
    return {
      PK: existing.PK,
      SK: key.SK,
      reminderId: input.reminderId,
      yearMonth: input.yearMonth,
      paid: false,
    };
  }

  const record: ReminderOccurrenceRecord = {
    PK: existing.PK,
    SK: key.SK,
    reminderId: input.reminderId,
    yearMonth: input.yearMonth,
    paid: true,
    paidAt: new Date().toISOString(),
    paidByUserId: input.userId,
    paidByName: input.paidByName,
  };
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: record }));
  return record;
}

export async function deleteReminder(
  userId: string,
  familyId: string | undefined,
  reminderId: string,
): Promise<void> {
  const pk = ownerPK(userId, familyId);
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: reminderSK(reminderId) },
    }),
  );
  const occurrences = await listOccurrences(userId, familyId);
  const related = occurrences.filter((item) => item.reminderId === reminderId);
  const pushes = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": pk,
        ":prefix": "REMINDERPUSH#",
      },
    }),
  );
  const pushItems = ((pushes.Items as ReminderPushRecord[]) ?? []).filter(
    (item) => item.reminderId === reminderId,
  );
  await Promise.all(
    [...related, ...pushItems].map((item) =>
      docClient.send(
        new DeleteCommand({ TableName: TABLE_NAME, Key: { PK: item.PK, SK: item.SK } }),
      ),
    ),
  );
}

export interface PublicReminder {
  reminderId: string;
  name: string;
  dayOfMonth: number;
  createdAt: string;
  updatedAt: string;
  paid: boolean;
  paidAt?: string;
  paidByName?: string;
  history: Array<{
    yearMonth: string;
    paid: boolean;
    paidAt?: string;
    paidByName?: string;
  }>;
}

function createdYearMonth(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "197001";
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function toPublicReminders(
  reminders: ReminderRecord[],
  occurrences: ReminderOccurrenceRecord[],
  month: string,
): PublicReminder[] {
  const byReminder = new Map<string, Map<string, ReminderOccurrenceRecord>>();
  for (const occ of occurrences) {
    const inner = byReminder.get(occ.reminderId) ?? new Map();
    inner.set(occ.yearMonth, occ);
    byReminder.set(occ.reminderId, inner);
  }

  const window = monthsBack(month, HISTORY_MONTHS);

  return reminders.map((reminder) => {
    const occs = byReminder.get(reminder.reminderId) ?? new Map();
    const current = occs.get(month);
    const start = createdYearMonth(reminder.createdAt);
    const history = window
      .filter((ym) => ym >= start)
      .map((yearMonth) => {
        const occ = occs.get(yearMonth);
        return {
          yearMonth,
          paid: occ?.paid === true,
          paidAt: occ?.paidAt,
          paidByName: occ?.paidByName,
        };
      });
    return {
      reminderId: reminder.reminderId,
      name: reminder.name,
      dayOfMonth: reminder.dayOfMonth,
      createdAt: reminder.createdAt,
      updatedAt: reminder.updatedAt,
      paid: current?.paid === true,
      paidAt: current?.paidAt,
      paidByName: current?.paidByName,
      history,
    };
  });
}

export function parseOwnerPk(pk: string): { userId: string; familyId?: string } {
  if (pk.startsWith("FAMILY#")) return { userId: "", familyId: pk.slice("FAMILY#".length) };
  if (pk.startsWith("USER#")) return { userId: pk.slice("USER#".length) };
  return { userId: "" };
}

export async function scanAllReminders(): Promise<ReminderRecord[]> {
  const items: ReminderRecord[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "begins_with(SK, :prefix)",
        ExpressionAttributeValues: { ":prefix": "REMINDER#" },
        ExclusiveStartKey,
      }),
    );
    for (const item of result.Items ?? []) {
      if (typeof item.reminderId === "string" && typeof item.dayOfMonth === "number") {
        items.push(item as ReminderRecord);
      }
    }
    ExclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (ExclusiveStartKey);
  return items;
}

export async function alreadyPushed(
  pk: string,
  yearMonth: string,
  reminderId: string,
  userId: string,
): Promise<boolean> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: pushSK(yearMonth, reminderId, userId) },
    }),
  );
  return Boolean(result.Item);
}

export async function markPushed(
  pk: string,
  yearMonth: string,
  reminderId: string,
  userId: string,
): Promise<void> {
  const record: ReminderPushRecord = {
    PK: pk,
    SK: pushSK(yearMonth, reminderId, userId),
    reminderId,
    yearMonth,
    userId,
    notifiedAt: new Date().toISOString(),
  };
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: record }));
}
