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
  ReminderRecurrence,
} from "../types.js";

export const DEFAULT_NOTIFY_TIME = "09:00";
export const REMINDER_TZ = "America/Sao_Paulo";
export const UPCOMING_MONTHS = 12;
const NAME_MAX = 80;

function ownerPK(userId: string, familyId?: string): string {
  return familyId ? `FAMILY#${familyId}` : `USER#${userId}`;
}

function reminderSK(reminderId: string): string {
  return `REMINDER#${reminderId}`;
}

function occurrenceDateSK(date: string, reminderId: string): string {
  return `REMINDEROCC#${date}#${reminderId}`;
}

function occurrenceMonthSK(yearMonth: string, reminderId: string): string {
  return `REMINDEROCC#${yearMonth}#${reminderId}`;
}

function pushDateSK(date: string, reminderId: string, userId: string): string {
  return `REMINDERPUSH#${date}#${reminderId}#${userId}`;
}

function pushMonthSK(yearMonth: string, reminderId: string, userId: string): string {
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

export function parseRecurrence(raw: unknown): ReminderRecurrence | null {
  if (raw === "once" || raw === "monthly" || raw === "yearly") return raw;
  return null;
}

export function parseIsoDate(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const year = Number(raw.slice(0, 4));
  const month = Number(raw.slice(5, 7));
  const day = Number(raw.slice(8, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return raw;
}

export function isoToYearMonth(date: string): string {
  return `${date.slice(0, 4)}${date.slice(5, 7)}`;
}

export function shiftYearMonth(yearMonth: string, delta: number): string {
  const year = parseInt(yearMonth.slice(0, 4), 10);
  const month = parseInt(yearMonth.slice(4, 6), 10);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthsForward(from: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => shiftYearMonth(from, i));
}

export function dueDayInMonth(dayOfMonth: number, yearMonth: string): number {
  const year = parseInt(yearMonth.slice(0, 4), 10);
  const month = parseInt(yearMonth.slice(4, 6), 10);
  const daysInMonth = new Date(year, month, 0).getDate();
  return Math.min(dayOfMonth, daysInMonth);
}

export function dueDateInMonth(dayOfMonth: number, yearMonth: string): string {
  const due = dueDayInMonth(dayOfMonth, yearMonth);
  return `${yearMonth.slice(0, 4)}-${yearMonth.slice(4, 6)}-${String(due).padStart(2, "0")}`;
}

export function yearlyDate(startDate: string, year: number): string {
  const month = startDate.slice(5, 7);
  const day = parseInt(startDate.slice(8, 10), 10);
  return dueDateInMonth(day, `${year}${month}`);
}

export function recurrenceDayOfMonth(
  reminder: Pick<ReminderRecord, "startDate" | "dayOfMonth">,
): number {
  const start = parseIsoDate(reminder.startDate);
  if (start) return parseInt(start.slice(8, 10), 10);
  return reminder.dayOfMonth || 1;
}

export function recurrenceAnchor(
  reminder: Pick<ReminderRecord, "startDate" | "dayOfMonth" | "createdAt">,
): string {
  const start = parseIsoDate(reminder.startDate);
  if (start) return start;
  const created = new Date(reminder.createdAt);
  const year = Number.isNaN(created.getTime()) ? 1970 : created.getUTCFullYear();
  const month = Number.isNaN(created.getTime()) ? 1 : created.getUTCMonth() + 1;
  const day = recurrenceDayOfMonth(reminder);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function effectiveStartDate(reminder: Pick<ReminderRecord, "startDate" | "dayOfMonth" | "createdAt">): string {
  const start = parseIsoDate(reminder.startDate);
  if (start) return start;
  const created = new Date(reminder.createdAt);
  const year = Number.isNaN(created.getTime()) ? 1970 : created.getUTCFullYear();
  const month = Number.isNaN(created.getTime()) ? 1 : created.getUTCMonth() + 1;
  const yearMonth = `${year}${String(month).padStart(2, "0")}`;
  return dueDateInMonth(recurrenceDayOfMonth(reminder), yearMonth);
}

export function effectiveRecurrence(reminder: Pick<ReminderRecord, "recurrence">): ReminderRecurrence {
  return reminder.recurrence === "once" || reminder.recurrence === "yearly" ? reminder.recurrence : "monthly";
}

export function matchesDueDate(
  reminder: Pick<ReminderRecord, "startDate" | "recurrence" | "dayOfMonth" | "createdAt">,
  ymd: string,
): boolean {
  const start = effectiveStartDate(reminder);
  if (ymd < start) return false;
  const rec = effectiveRecurrence(reminder);
  const day = recurrenceDayOfMonth(reminder);
  if (rec === "once") return ymd === start;
  if (rec === "yearly") return yearlyDate(recurrenceAnchor(reminder), parseInt(ymd.slice(0, 4), 10)) === ymd;
  return dueDateInMonth(day, isoToYearMonth(ymd)) === ymd;
}

export function expandOccurrenceDates(
  reminder: Pick<ReminderRecord, "startDate" | "recurrence" | "dayOfMonth" | "createdAt">,
  fromYmd: string,
  throughYearMonth: string,
): string[] {
  const start = effectiveStartDate(reminder);
  const rec = effectiveRecurrence(reminder);
  const day = recurrenceDayOfMonth(reminder);
  if (rec === "once") {
    if (start >= fromYmd && isoToYearMonth(start) <= throughYearMonth) return [start];
    return [];
  }
  if (rec === "yearly") {
    const dates: string[] = [];
    const fromYear = parseInt(fromYmd.slice(0, 4), 10);
    const throughYear = parseInt(throughYearMonth.slice(0, 4), 10);
    const startYear = parseInt(start.slice(0, 4), 10);
    const anchor = recurrenceAnchor(reminder);
    for (let year = Math.max(startYear, fromYear); year <= throughYear; year += 1) {
      const date = yearlyDate(anchor, year);
      if (date >= start && date >= fromYmd && isoToYearMonth(date) <= throughYearMonth) {
        dates.push(date);
      }
    }
    return dates;
  }
  const startMonth = isoToYearMonth(start);
  const firstMonth = startMonth > isoToYearMonth(fromYmd) ? startMonth : isoToYearMonth(fromYmd);
  const dates: string[] = [];
  for (let ym = firstMonth; ym <= throughYearMonth; ym = shiftYearMonth(ym, 1)) {
    const date = dueDateInMonth(day, ym);
    if (date >= start && date >= fromYmd) dates.push(date);
  }
  return dates;
}

export function isAtOrAfterNotifyTime(notifyTime: string, hour: number, minute: number): boolean {
  const parsed = parseNotifyTime(notifyTime) ?? DEFAULT_NOTIFY_TIME;
  const [hours, minutes] = parsed.split(":").map(Number);
  return hour > hours || (hour === hours && minute >= minutes);
}

export function saoPauloParts(now = new Date()): {
  yearMonth: string;
  date: string;
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
  const year = get("year");
  const month = get("month");
  const day = get("day");
  return {
    yearMonth: `${year}${month}`,
    date: `${year}-${month}-${day}`,
    day: Number(day),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

export async function createReminder(input: {
  userId: string;
  familyId?: string;
  name: string;
  startDate: string;
  recurrence: ReminderRecurrence;
}): Promise<ReminderRecord> {
  const reminderId = ulid();
  const now = new Date().toISOString();
  const dayOfMonth = parseInt(input.startDate.slice(8, 10), 10);
  const record: ReminderRecord = {
    PK: ownerPK(input.userId, input.familyId),
    SK: reminderSK(reminderId),
    reminderId,
    name: input.name,
    dayOfMonth,
    startDate: input.startDate,
    recurrence: input.recurrence,
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
  return ((result.Items as ReminderRecord[]) ?? []).sort((a, b) => {
    const aStart = effectiveStartDate(a);
    const bStart = effectiveStartDate(b);
    return aStart === bStart ? a.name.localeCompare(b.name) : aStart.localeCompare(bStart);
  });
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
  update: { name?: string; startDate?: string; recurrence?: ReminderRecurrence },
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
  if (update.startDate !== undefined) {
    sets.push("startDate = :start");
    sets.push("dayOfMonth = :day");
    values[":start"] = update.startDate;
    values[":day"] = parseInt(update.startDate.slice(8, 10), 10);
  }
  if (update.recurrence !== undefined) {
    sets.push("recurrence = :rec");
    values[":rec"] = update.recurrence;
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

function occurrenceLookupDate(occ: ReminderOccurrenceRecord): string | null {
  if (occ.date && parseIsoDate(occ.date)) return occ.date;
  const fromSk = occ.SK.match(/^REMINDEROCC#(\d{4}-\d{2}-\d{2})#/);
  if (fromSk) return fromSk[1];
  return null;
}

export function findPaidOccurrence(
  occurrences: ReminderOccurrenceRecord[],
  reminderId: string,
  date: string,
): ReminderOccurrenceRecord | undefined {
  const yearMonth = isoToYearMonth(date);
  return occurrences.find((occ) => {
    if (occ.reminderId !== reminderId || occ.paid !== true) return false;
    const occDate = occurrenceLookupDate(occ);
    if (occDate) return occDate === date;
    return occ.yearMonth === yearMonth;
  });
}

export async function getOccurrence(
  pk: string,
  date: string,
  reminderId: string,
): Promise<ReminderOccurrenceRecord | null> {
  const dated = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: occurrenceDateSK(date, reminderId) },
    }),
  );
  if (dated.Item) return dated.Item as ReminderOccurrenceRecord;
  const legacy = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: occurrenceMonthSK(isoToYearMonth(date), reminderId) },
    }),
  );
  return (legacy.Item as ReminderOccurrenceRecord | undefined) ?? null;
}

export async function setReminderPaid(input: {
  userId: string;
  familyId?: string;
  reminderId: string;
  date: string;
  paid: boolean;
  paidByName: string;
}): Promise<ReminderOccurrenceRecord | null> {
  const existing = await getReminder(input.userId, input.familyId, input.reminderId);
  if (!existing) return null;
  const yearMonth = isoToYearMonth(input.date);
  const dateKey = { PK: existing.PK, SK: occurrenceDateSK(input.date, input.reminderId) };
  const monthKey = { PK: existing.PK, SK: occurrenceMonthSK(yearMonth, input.reminderId) };

  if (!input.paid) {
    await Promise.all([
      docClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: dateKey })),
      docClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: monthKey })),
    ]);
    return {
      PK: existing.PK,
      SK: dateKey.SK,
      reminderId: input.reminderId,
      yearMonth,
      date: input.date,
      paid: false,
    };
  }

  const record: ReminderOccurrenceRecord = {
    PK: existing.PK,
    SK: dateKey.SK,
    reminderId: input.reminderId,
    yearMonth,
    date: input.date,
    paid: true,
    paidAt: new Date().toISOString(),
    paidByUserId: input.userId,
    paidByName: input.paidByName,
  };
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: record }));
  await docClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: monthKey }));
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

export interface PublicReminderSeries {
  reminderId: string;
  name: string;
  startDate: string;
  recurrence: ReminderRecurrence;
  dayOfMonth: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicOccurrence {
  reminderId: string;
  name: string;
  date: string;
  yearMonth: string;
  recurrence: ReminderRecurrence;
  paid: boolean;
  paidAt?: string;
  paidByName?: string;
}

export interface PublicMonthOccurrences {
  yearMonth: string;
  occurrences: PublicOccurrence[];
}

export function toPublicSeries(reminder: ReminderRecord): PublicReminderSeries {
  const startDate = effectiveStartDate(reminder);
  const recurrence = effectiveRecurrence(reminder);
  return {
    reminderId: reminder.reminderId,
    name: reminder.name,
    startDate,
    recurrence,
    dayOfMonth: parseInt(startDate.slice(8, 10), 10),
    createdAt: reminder.createdAt,
    updatedAt: reminder.updatedAt,
  };
}

export function toUpcomingMonths(
  reminders: ReminderRecord[],
  occurrences: ReminderOccurrenceRecord[],
  fromYmd: string,
  months: number = UPCOMING_MONTHS,
): PublicMonthOccurrences[] {
  const through = shiftYearMonth(isoToYearMonth(fromYmd), months - 1);
  const grouped = new Map<string, PublicOccurrence[]>();
  for (const ym of monthsForward(isoToYearMonth(fromYmd), months)) {
    grouped.set(ym, []);
  }

  for (const reminder of reminders) {
    const recurrence = effectiveRecurrence(reminder);
    for (const date of expandOccurrenceDates(reminder, fromYmd, through)) {
      const yearMonth = isoToYearMonth(date);
      const list = grouped.get(yearMonth);
      if (!list) continue;
      const paid = findPaidOccurrence(occurrences, reminder.reminderId, date);
      list.push({
        reminderId: reminder.reminderId,
        name: reminder.name,
        date,
        yearMonth,
        recurrence,
        paid: paid?.paid === true,
        paidAt: paid?.paidAt,
        paidByName: paid?.paidByName,
      });
    }
  }

  for (const list of grouped.values()) {
    list.sort((a, b) => (a.date === b.date ? a.name.localeCompare(b.name) : a.date.localeCompare(b.date)));
  }

  return [...grouped.entries()]
    .filter(([, occs]) => occs.length > 0)
    .map(([yearMonth, occs]) => ({ yearMonth, occurrences: occs }));
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
      if (typeof item.reminderId === "string") {
        items.push(item as ReminderRecord);
      }
    }
    ExclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (ExclusiveStartKey);
  return items;
}

export async function alreadyPushed(
  pk: string,
  date: string,
  reminderId: string,
  userId: string,
): Promise<boolean> {
  const dated = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: pushDateSK(date, reminderId, userId) },
    }),
  );
  if (dated.Item) return true;
  const legacy = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: pushMonthSK(isoToYearMonth(date), reminderId, userId) },
    }),
  );
  return Boolean(legacy.Item);
}

export async function markPushed(
  pk: string,
  date: string,
  reminderId: string,
  userId: string,
): Promise<void> {
  const record: ReminderPushRecord = {
    PK: pk,
    SK: pushDateSK(date, reminderId, userId),
    reminderId,
    yearMonth: isoToYearMonth(date),
    date,
    userId,
    notifiedAt: new Date().toISOString(),
  };
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: record }));
}
