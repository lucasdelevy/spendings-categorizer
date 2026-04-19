export type StatementType = "bank" | "card";

export interface Transaction {
  date: string;
  amount: number;
  category: string;
  payee: string;
  installment: string;
  originalDescription: string;
}

export interface CategorySummary {
  category: string;
  total: number;
  count: number;
  transactions: Transaction[];
}

export interface StatementResult {
  type: StatementType;
  transactions: Transaction[];
  categories: CategorySummary[];
  totalIn: number;
  totalOut: number;
  balance: number;
}
