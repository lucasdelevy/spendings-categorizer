import type { Transaction, StatementResult } from "../types";
import { compareDatesDesc } from "../utils/dates";

const CARD_BILL_CATEGORY = "Fatura Cartão";

export function processFamilyStatements(
  bankResults: StatementResult[],
  cardResults: StatementResult[],
): StatementResult {
  const bankTransactions = bankResults.flatMap((r) =>
    r.transactions.filter((t) => t.category !== CARD_BILL_CATEGORY),
  );

  const cardTransactions = cardResults.flatMap((r) =>
    r.transactions.filter((t) => t.amount < 0),
  );

  const all = [...bankTransactions, ...cardTransactions];

  const catMap = new Map<
    string,
    { total: number; count: number; transactions: Transaction[] }
  >();

  let totalIn = 0;
  let totalOut = 0;

  for (const t of all) {
    if (t.amount >= 0) totalIn += t.amount;
    else totalOut += t.amount;

    const existing = catMap.get(t.category);
    if (existing) {
      existing.total += t.amount;
      existing.count += 1;
      existing.transactions.push(t);
    } else {
      catMap.set(t.category, {
        total: t.amount,
        count: 1,
        transactions: [t],
      });
    }
  }

  const categories = Array.from(catMap.entries())
    .map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
      transactions: data.transactions.sort((a, b) =>
        compareDatesDesc(a.date, b.date),
      ),
    }))
    .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));

  const transactions = [...all];

  return {
    type: "family",
    transactions,
    categories,
    totalIn,
    totalOut,
    balance: totalIn + totalOut,
  };
}
