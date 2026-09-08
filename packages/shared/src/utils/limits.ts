import type { CategoryEntry, CategoryLimit, LimitPeriod } from "../types";

export const DEFAULT_LIMIT_ALERT_PERCENT = 80;

export function clampLimitAlertPercent(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return DEFAULT_LIMIT_ALERT_PERCENT;
  return Math.min(100, Math.max(1, Math.round(n)));
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

export function effectiveMonthlyLimit(limit: CategoryLimit, yearMonth: string): number {
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

export function limitProgress(spent: number, limit: CategoryLimit, yearMonth: string): number {
  const budget = effectiveMonthlyLimit(limit, yearMonth);
  if (budget <= 0) return 0;
  return Math.abs(spent) / budget;
}

export function limitColor(progress: number): "green" | "amber" | "red" {
  if (progress >= 1) return "red";
  if (progress >= 0.75) return "amber";
  return "green";
}
