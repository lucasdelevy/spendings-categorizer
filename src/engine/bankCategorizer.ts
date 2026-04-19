import type { RawRow } from "./csvParser";
import type { Transaction, StatementResult } from "../types";
import { BANK_CATEGORIES, BANK_IGNORE, BANK_RENAME } from "./categories";

function categorize(description: string): string {
  const lower = description.toLowerCase();
  for (const [category, keywords] of Object.entries(BANK_CATEGORIES)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) return category;
    }
  }
  return "Sem Categoria";
}

function shouldIgnore(description: string): boolean {
  const lower = description.toLowerCase();
  return BANK_IGNORE.some((term) => lower.includes(term));
}

function parseBrazilianAmount(raw: string): number {
  let cleaned = raw.trim().replace(/"/g, "").replace(/R\$/, "").replace(/ /g, "");
  if (cleaned.includes(",") && cleaned.includes(".")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    cleaned = cleaned.replace(",", ".");
  }
  if (!cleaned || cleaned === "-") return 0;
  return parseFloat(cleaned);
}

function extractPayee(desc: string): string {
  const lower = desc.toLowerCase();
  if (lower.includes("pix -")) {
    const after = desc.includes(" - ") ? desc.split(" - ", 2)[1] : desc;
    return after.split(" - ")[0].trim().substring(0, 60);
  }
  for (const prefix of [
    "Compra no débito - ",
    "Compra no debito - ",
    "Pagamento de boleto efetuado - ",
  ]) {
    if (lower.includes(prefix.toLowerCase())) {
      const idx = lower.indexOf(prefix.toLowerCase()) + prefix.length;
      return desc.substring(idx).trim().substring(0, 60);
    }
  }
  return desc.substring(0, 60);
}

function findColumn(
  headers: string[],
  targets: string[],
): string | undefined {
  return headers.find((h) => targets.includes(h.trim().toLowerCase()));
}

export function processBankCSV(
  headers: string[],
  rows: RawRow[],
): StatementResult {
  const colData = findColumn(headers, ["data"]);
  const colValor = findColumn(headers, ["valor"]);
  const colDesc = findColumn(headers, ["descrição", "descricao"]);

  if (!colValor || !colDesc) {
    throw new Error("Colunas 'Valor' ou 'Descrição' não encontradas.");
  }

  const transactions: Transaction[] = [];

  for (const row of rows) {
    const desc = (row[colDesc] ?? "").trim();
    if (!desc || shouldIgnore(desc)) continue;

    const amount = parseBrazilianAmount(row[colValor] ?? "");
    const date = colData ? (row[colData] ?? "").trim() : "";
    const category = categorize(desc);
    const rawPayee = extractPayee(desc);
    const payee = BANK_RENAME[rawPayee.toLowerCase()] ?? rawPayee;

    transactions.push({
      date,
      amount,
      category,
      payee,
      installment: "",
      originalDescription: desc,
      source: "bank",
    });
  }

  return buildResult("bank", transactions);
}

function buildResult(
  type: "bank",
  transactions: Transaction[],
): StatementResult {
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
    type,
    transactions,
    categories,
    totalIn,
    totalOut,
    balance: totalIn + totalOut,
  };
}
