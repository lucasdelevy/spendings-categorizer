import type { Transaction, StatementResult } from "../types";

const CARD_BILL_CATEGORY = "Fatura Cartão";

export function processFamilyStatements(
  bankResults: StatementResult[],
  cardResults: StatementResult[],
): StatementResult {
  const bankTransactions = bankResults.flatMap((r) =>
    r.transactions.filter((t) => t.category !== CARD_BILL_CATEGORY),
  );

  const cardTransactions = cardResults.flatMap((r) =>
    r.transactions.filter((t) => t.amount > 0),
  );

  const all = [...bankTransactions, ...cardTransactions];

  const catMap = new Map<
    string,
    { total: number; count: number; transactions: Transaction[] }
  >();

  let totalIn = 0;
  let totalOut = 0;

  for (const t of all) {
    const expenseAmount = t.source === "card" ? -t.amount : t.amount;

    if (expenseAmount >= 0) totalIn += expenseAmount;
    else totalOut += expenseAmount;

    const normalized: Transaction = {
      ...t,
      amount: expenseAmount,
    };

    const existing = catMap.get(t.category);
    if (existing) {
      existing.total += expenseAmount;
      existing.count += 1;
      existing.transactions.push(normalized);
    } else {
      catMap.set(t.category, {
        total: expenseAmount,
        count: 1,
        transactions: [normalized],
      });
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

  const transactions = all.map((t) => ({
    ...t,
    amount: t.source === "card" ? -t.amount : t.amount,
  }));

  return {
    type: "family",
    transactions,
    categories,
    totalIn,
    totalOut,
    balance: totalIn + totalOut,
  };
}
