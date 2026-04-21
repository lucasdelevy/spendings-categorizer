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
  hidden?: boolean;
  _originalIndex?: number;
}

export interface CategoryEntry {
  keywords: string[];
  color: string;
}

export interface CategoryConfig {
  categories: Record<string, CategoryEntry>;
  ignore: string[];
  rename: Record<string, string>;
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
