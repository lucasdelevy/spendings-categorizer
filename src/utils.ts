import { resolveLocale } from "./i18n";

export function extractYearMonth(dateStr: string): string {
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    return `${parts[2]}${parts[1]}`;
  }
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    return `${parts[0]}${parts[1]}`;
  }
  throw new Error(`Unrecognized date format: ${dateStr}`);
}

export function formatYearMonth(ym: string): string {
  const month = parseInt(ym.slice(4, 6), 10);
  const year = parseInt(ym.slice(0, 4), 10);
  const d = new Date(year, month - 1);
  const locale = resolveLocale();
  const monthStr = d.toLocaleDateString(locale, { month: "long" });
  return `${monthStr.charAt(0).toUpperCase()}${monthStr.slice(1)} ${year}`;
}

export function currentYearMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}${m}`;
}

export interface SavedStatementItem {
  id: string;
  fileName: string;
  uploadedAt: string;
  type: "bank" | "card" | "family";
  totalOut: number;
  categoryCount: number;
  transactionCount: number;
  uploadedBy?: { userId: string; name: string; picture: string } | null;
}
