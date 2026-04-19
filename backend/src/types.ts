export interface UserRecord {
  PK: string;
  SK: "PROFILE";
  email: string;
  name: string;
  picture: string;
  googleId: string;
  createdAt: string;
}

export interface SessionRecord {
  PK: string;
  SK: string;
  expiresAt: number;
  createdAt: string;
}

export interface StatementRecord {
  PK: string;
  SK: string;
  fileName: string;
  uploadedAt: string;
  summary: StatementSummary;
  transactions: TransactionItem[];
}

export interface StatementSummary {
  type: "bank" | "card" | "family";
  totalIn: number;
  totalOut: number;
  balance: number;
  categories: CategorySummaryItem[];
}

export interface CategorySummaryItem {
  category: string;
  total: number;
  count: number;
}

export interface TransactionItem {
  date: string;
  amount: number;
  category: string;
  payee: string;
  installment: string;
  originalDescription: string;
  source?: "bank" | "card";
}

export interface JWTPayload {
  userId: string;
  sessionId: string;
}

export interface ApiResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}
