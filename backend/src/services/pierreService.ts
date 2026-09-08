import type { TransactionItem } from "../types.js";
import { FALLBACK_CATEGORY } from "../defaults/categories.js";
import { cleanPayeeName } from "./payeeUtils.js";
import { isRefund } from "./refunds.js";

const PIERRE_BASE_URL = "https://pierre.finance/tools/api";

export class PierreAuthError extends Error {
  readonly pierreType: "expired_api_key" | "invalid_api_key";

  constructor(pierreType: "expired_api_key" | "invalid_api_key", message: string) {
    super(message);
    this.name = "PierreAuthError";
    this.pierreType = pierreType;
  }
}

export function isPierreAuthError(err: unknown): err is PierreAuthError {
  return err instanceof PierreAuthError;
}

function throwPierreError(status: number, text: string, action: string): never {
  let type: string | undefined;
  try {
    const parsed = JSON.parse(text) as { type?: string };
    type = parsed.type;
  } catch {
    /* body is not JSON */
  }
  if (type === "expired_api_key" || type === "invalid_api_key") {
    throw new PierreAuthError(type, `Pierre ${action} failed (${status}): ${text}`);
  }
  throw new Error(`Pierre ${action} failed (${status}): ${text}`);
}

export interface PierreTransaction {
  id: string;
  account_id: string;
  description: string;
  category: string;
  original_category: string;
  currency_code: string;
  amount: string;
  date: string;
  type: "CREDIT" | "DEBIT";
  status: string;
  account_type: "BANK" | "CREDIT";
  credit_card_data?: {
    installmentNumber?: number;
    totalInstallments?: number;
  } | null;
  payment_data?: {
    payer?: { name?: string | null; document?: string | null } | null;
    receiver?: { name?: string | null; document?: string | null } | null;
  } | null;
  merchant?: string | null;
  account_name?: string;
  manual_transaction?: boolean;
}

export async function fetchTransactions(
  apiKey: string,
  startDate: string,
  endDate: string,
): Promise<PierreTransaction[]> {
  const params = new URLSearchParams({
    startDate,
    endDate,
    format: "raw",
  });

  const res = await fetch(`${PIERRE_BASE_URL}/get-transactions?${params}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throwPierreError(res.status, text, "get-transactions");
  }

  const json = (await res.json()) as { data?: PierreTransaction[] };
  const txs = json?.data;
  if (!Array.isArray(txs)) {
    throw new Error(`Unexpected Pierre response shape: ${JSON.stringify(json).slice(0, 200)}`);
  }
  return txs as PierreTransaction[];
}

export async function triggerManualSync(apiKey: string): Promise<unknown> {
  const res = await fetch(`${PIERRE_BASE_URL}/manual-update`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throwPierreError(res.status, text, "manual-update");
  }

  return res.json();
}

export function mapPierreTransaction(tx: PierreTransaction): TransactionItem {
  const rawAmount = parseFloat(tx.amount);
  let amount: number;

  if (tx.account_type === "CREDIT") {
    // Pluggy credit-card convention: positive amount = charge,
    // negative amount = payment/refund. We negate so charges become
    // negative (outflow) and refunds/payments become positive (inflow),
    // matching the bank-side convention used everywhere else.
    amount = -rawAmount;
  } else {
    amount = tx.type === "DEBIT" && rawAmount > 0 ? -rawAmount : rawAmount;
  }

  // Refunds ("estorno") must always settle as a positive value regardless
  // of how the upstream source encoded them.
  if (isRefund(tx.description)) {
    amount = Math.abs(amount);
  }

  const isoDate = tx.date.includes("T") ? tx.date.split("T")[0] : tx.date;

  let installment = "";
  if (tx.credit_card_data?.installmentNumber && tx.credit_card_data?.totalInstallments) {
    installment = `${tx.credit_card_data.installmentNumber}/${tx.credit_card_data.totalInstallments}`;
  }

  const source: "bank" | "card" = tx.account_type === "BANK" ? "bank" : "card";

  return {
    date: isoDate,
    amount: Math.round(amount * 100) / 100,
    category: FALLBACK_CATEGORY,
    payee: cleanPayeeName(tx.description),
    installment,
    originalDescription: tx.description,
    source,
    origin: "openfinance",
    externalId: tx.id,
  };
}
