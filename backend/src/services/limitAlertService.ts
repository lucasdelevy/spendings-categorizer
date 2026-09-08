import { DeleteCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "./dynamoClient.js";
import { getMonthStatements } from "./statementService.js";
import { listMembers } from "./familyService.js";
import { listDevicesForUsers } from "./deviceService.js";
import { isPushConfigured, sendLimitAlerts } from "./pushService.js";
import type {
  CategoryConfigRecord,
  CategoryEntry,
  CategoryLimit,
  LimitAlertRecord,
  LimitPeriod,
} from "../types.js";

export const DEFAULT_LIMIT_ALERT_PERCENT = 80;

export function clampLimitAlertPercent(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return DEFAULT_LIMIT_ALERT_PERCENT;
  return Math.min(100, Math.max(1, Math.round(n)));
}

function effectiveMonthlyLimit(limit: CategoryLimit, yearMonth: string): number {
  const year = parseInt(yearMonth.slice(0, 4), 10);
  const month = parseInt(yearMonth.slice(4, 6), 10);
  const daysInMonth = new Date(year, month, 0).getDate();
  switch (limit.period) {
    case "monthly":
      return limit.amount;
    case "weekly":
      return limit.amount * (daysInMonth / 7);
    case "daily":
      return limit.amount * daysInMonth;
  }
}

function limitProgress(spent: number, limit: CategoryLimit, yearMonth: string): number {
  const budget = effectiveMonthlyLimit(limit, yearMonth);
  if (budget <= 0) return 0;
  return Math.abs(spent) / budget;
}

export interface LimitAlertBreach {
  category: string;
  percent: number;
  period: LimitPeriod;
}

export function findLimitAlertBreaches(
  totals: Record<string, number>,
  categories: Record<string, CategoryEntry>,
  yearMonth: string,
  thresholdPercent: number = DEFAULT_LIMIT_ALERT_PERCENT,
): LimitAlertBreach[] {
  const threshold = clampLimitAlertPercent(thresholdPercent) / 100;
  const breaches: LimitAlertBreach[] = [];
  for (const [name, entry] of Object.entries(categories)) {
    if (!entry.limit || entry.limit.amount <= 0) continue;
    const progress = limitProgress(totals[name] ?? 0, entry.limit, yearMonth);
    if (progress >= threshold) {
      breaches.push({
        category: name,
        percent: Math.round(progress * 100),
        period: entry.limit.period,
      });
    }
  }
  return breaches;
}

export function currentYearMonth(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  return `${year}${month}`;
}

export function shiftYearMonth(yearMonth: string, delta: number): string {
  const year = parseInt(yearMonth.slice(0, 4), 10);
  const month = parseInt(yearMonth.slice(4, 6), 10);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function ownerPk(userId: string, familyId?: string): string {
  return familyId ? `FAMILY#${familyId}` : `USER#${userId}`;
}

function categoryTotals(userId: string, yearMonth: string, familyId?: string) {
  return getMonthStatements(userId, yearMonth, familyId).then((records) => {
    const totals: Record<string, number> = {};
    for (const record of records) {
      for (const tx of record.transactions) {
        if (tx.hidden) continue;
        totals[tx.category] = (totals[tx.category] ?? 0) + tx.amount;
      }
    }
    return totals;
  });
}

async function alreadyNotified(
  pk: string,
  yearMonth: string,
  category: string,
): Promise<boolean> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: `LIMITALERT#${yearMonth}#${category}` },
    }),
  );
  return Boolean(result.Item);
}

async function clearNotified(pk: string, yearMonth: string, category: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: `LIMITALERT#${yearMonth}#${category}` },
    }),
  );
}

async function markNotified(
  pk: string,
  yearMonth: string,
  breach: LimitAlertBreach,
  threshold: number,
): Promise<void> {
  const record: LimitAlertRecord = {
    PK: pk,
    SK: `LIMITALERT#${yearMonth}#${breach.category}`,
    category: breach.category,
    yearMonth,
    percent: breach.percent,
    threshold,
    notifiedAt: new Date().toISOString(),
  };
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: record }));
}

async function recipientUserIds(userId: string, familyId?: string): Promise<string[]> {
  if (!familyId) return [userId];
  const members = await listMembers(familyId);
  const ids = members
    .filter((m) => m.status === "active" && m.SK.startsWith("MEMBER#"))
    .map((m) => m.SK.slice("MEMBER#".length));
  return ids.length > 0 ? ids : [userId];
}

export async function evaluateAndNotifyLimitAlerts(input: {
  userId: string;
  familyId?: string;
  config: CategoryConfigRecord;
}): Promise<{ notified: number; sent: number }> {
  const threshold = clampLimitAlertPercent(input.config.limitAlertPercent);
  const pk = ownerPk(input.userId, input.familyId);
  const months = [currentYearMonth(), shiftYearMonth(currentYearMonth(), 1)];

  const fresh: Array<LimitAlertBreach & { yearMonth: string }> = [];
  for (const yearMonth of months) {
    const totals = await categoryTotals(input.userId, yearMonth, input.familyId);
    const breaches = findLimitAlertBreaches(
      totals,
      input.config.categories,
      yearMonth,
      threshold,
    );
    const breached = new Set(breaches.map((b) => b.category));
    for (const [name, entry] of Object.entries(input.config.categories)) {
      if (!entry.limit || entry.limit.amount <= 0) continue;
      if (breached.has(name)) continue;
      if (await alreadyNotified(pk, yearMonth, name)) {
        await clearNotified(pk, yearMonth, name);
      }
    }
    for (const breach of breaches) {
      if (await alreadyNotified(pk, yearMonth, breach.category)) continue;
      fresh.push({ ...breach, yearMonth });
    }
  }

  if (fresh.length === 0) return { notified: 0, sent: 0 };

  const devices = await listDevicesForUsers(
    await recipientUserIds(input.userId, input.familyId),
  );
  if (devices.length === 0) {
    console.log("Limit alerts found but no registered devices; skipping push");
    return { notified: 0, sent: 0 };
  }

  if (!isPushConfigured()) {
    console.warn("Limit alerts found but APNs is not configured; skipping push");
    return { notified: 0, sent: 0 };
  }

  const sent = await sendLimitAlerts(devices, fresh);
  if (sent === 0) return { notified: 0, sent: 0 };

  for (const breach of fresh) {
    await markNotified(pk, breach.yearMonth, breach, threshold);
  }
  return { notified: fresh.length, sent };
}
