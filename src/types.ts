export type StatementType = "bank" | "card" | "family";

export type TransactionSource = "bank" | "card";

export interface UploadedBy {
  userId: string;
  name: string;
  picture: string;
}

export interface Transaction {
  date: string;
  amount: number;
  category: string;
  payee: string;
  installment: string;
  originalDescription: string;
  source?: TransactionSource;
  uploadedBy?: UploadedBy;
}

export interface CategoryEntry {
  keywords: string[];
  color: string;
}

export interface CategoryConfig {
  bankCategories: Record<string, CategoryEntry>;
  cardCategories: Record<string, CategoryEntry>;
  bankIgnore: string[];
  cardIgnore: string[];
  bankRename: Record<string, string>;
  cardRename: Record<string, string>;
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
