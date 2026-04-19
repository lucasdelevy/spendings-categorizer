const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export function extractYearMonth(dateStr: string): string {
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    return `${parts[2]}${parts[1]}`;
  }
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    return `${parts[0]}${parts[1]}`;
  }
  throw new Error(`Formato de data não reconhecido: ${dateStr}`);
}

export function formatYearMonth(ym: string): string {
  const month = parseInt(ym.slice(4, 6), 10);
  const year = ym.slice(0, 4);
  return `${MONTH_NAMES[month - 1] ?? ym.slice(4, 6)} ${year}`;
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
