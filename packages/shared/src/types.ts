export type StatementType = "bank" | "card" | "family";

export type TransactionSource = "bank" | "card";

export type TransactionOrigin = "csv" | "openfinance";

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
  origin?: TransactionOrigin;
  accountId?: string;
  billingMonth?: string;
  _originalIndex?: number;
}

export type AccountType = "bank" | "card";

export interface Account {
  accountId: string;
  name: string;
  type: AccountType;
  closingDay?: number;
  hasApiKey: boolean;
  apiKeyHint?: string;
  apiKeyExpired?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type ReminderRecurrence = "once" | "monthly" | "yearly";

export interface ReminderSeries {
  reminderId: string;
  name: string;
  startDate: string;
  recurrence: ReminderRecurrence;
  dayOfMonth: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderOccurrence {
  reminderId: string;
  name: string;
  date: string;
  yearMonth: string;
  recurrence: ReminderRecurrence;
  paid: boolean;
  paidAt?: string;
  paidByName?: string;
}

export interface ReminderMonth {
  yearMonth: string;
  occurrences: ReminderOccurrence[];
}

export type LimitPeriod = "daily" | "weekly" | "monthly";

export interface CategoryLimit {
  amount: number;
  period: LimitPeriod;
}

export interface CategoryEntry {
  keywords: string[];
  color: string;
  limit?: CategoryLimit;
}

export interface CategoryConfig {
  categories: Record<string, CategoryEntry>;
  ignore: string[];
  rename: Record<string, string>;
  /** Notify when spend reaches this percent of a category limit. Default 80. */
  limitAlertPercent?: number;
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
