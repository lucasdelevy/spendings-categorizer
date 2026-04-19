export interface UserRecord {
  PK: string;
  SK: "PROFILE";
  email: string;
  name: string;
  picture: string;
  googleId: string;
  familyId?: string;
  createdAt: string;
}

export interface FamilyRecord {
  PK: string;
  SK: "META";
  name: string;
  createdBy: string;
  createdAt: string;
}

export type FamilyMemberRole = "owner" | "member";
export type FamilyMemberStatus = "active" | "pending";

export interface FamilyMemberRecord {
  PK: string;
  SK: string;
  email: string;
  name: string;
  picture: string;
  role: FamilyMemberRole;
  status: FamilyMemberStatus;
  joinedAt: string;
}

export interface EmailFamilyLookup {
  PK: string;
  SK: "LINK";
  familyId: string;
}

export interface UploadedBy {
  userId: string;
  name: string;
  picture: string;
}

export interface SessionRecord {
  PK: string;
  SK: string;
  expiresAt: number;
  createdAt: string;
}

export type StatementStatus = "active" | "overridden";

export interface StatementRecord {
  PK: string;
  SK: string;
  fileName: string;
  uploadedAt: string;
  status: StatementStatus;
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
  uploadedBy?: UploadedBy;
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
