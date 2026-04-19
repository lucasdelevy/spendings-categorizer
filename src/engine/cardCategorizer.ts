import type { RawRow } from "./csvParser";
import type { Transaction, StatementResult } from "../types";
import { CARD_CATEGORIES, CARD_IGNORE, CARD_RENAME } from "./categories";

const INSTALLMENT_RE = / - Parcela (\d+\/\d+)$/i;

function categorize(title: string): string {
  const lower = title.toLowerCase();
  for (const [category, keywords] of Object.entries(CARD_CATEGORIES)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) return category;
    }
  }
  return "Sem Categoria";
}

function shouldIgnore(title: string): boolean {
  const lower = title.toLowerCase();
  return CARD_IGNORE.some((term) => lower.includes(term));
}

function extractInstallment(title: string): [string, string] {
  const match = INSTALLMENT_RE.exec(title);
  if (match) {
    return [title.replace(INSTALLMENT_RE, "").trim(), match[1]];
  }
  return [title, ""];
}

function renamePayee(name: string): string {
  return CARD_RENAME[name.toLowerCase()] ?? name;
}

function findColumn(
  headers: string[],
  targets: string[],
): string | undefined {
  return headers.find((h) => targets.includes(h.trim().toLowerCase()));
}

export function processCardCSV(
  headers: string[],
  rows: RawRow[],
): StatementResult {
  const colDate = findColumn(headers, ["date"]);
  const colTitle = findColumn(headers, ["title"]);
  const colAmount = findColumn(headers, ["amount"]);

  if (!colTitle || !colAmount) {
    throw new Error("Colunas 'title' ou 'amount' não encontradas.");
  }

  const transactions: Transaction[] = [];

  for (const row of rows) {
    const title = (row[colTitle] ?? "").trim();
    if (!title || shouldIgnore(title)) continue;

    const rawAmount = (row[colAmount] ?? "").trim().replace(",", "");
    const amount = rawAmount ? parseFloat(rawAmount) : 0;
    const date = colDate ? (row[colDate] ?? "").trim() : "";
    const [cleanName, installment] = extractInstallment(title);
    const category = categorize(title);
    const payee = renamePayee(cleanName);

    transactions.push({
      date,
      amount,
      category,
      payee,
      installment,
      originalDescription: title,
      source: "card",
    });
  }

  return buildResult(transactions);
}

function buildResult(transactions: Transaction[]): StatementResult {
  const catMap = new Map<
    string,
    { total: number; count: number; transactions: Transaction[] }
  >();

  let totalIn = 0;
  let totalOut = 0;

  for (const t of transactions) {
    if (t.amount >= 0) totalIn += t.amount;
    else totalOut += t.amount;

    const existing = catMap.get(t.category);
    if (existing) {
      existing.total += t.amount;
      existing.count += 1;
      existing.transactions.push(t);
    } else {
      catMap.set(t.category, { total: t.amount, count: 1, transactions: [t] });
    }
  }

  const categories = Array.from(catMap.entries())
    .map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
      transactions: data.transactions.sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    }))
    .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));

  return {
    type: "card",
    transactions,
    categories,
    totalIn,
    totalOut,
    balance: totalIn + totalOut,
  };
}
