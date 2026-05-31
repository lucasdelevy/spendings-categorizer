import type { CategoryLimit } from "../types";

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
