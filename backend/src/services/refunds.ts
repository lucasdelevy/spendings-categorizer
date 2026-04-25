/**
 * Heuristic to detect refund-like transactions ("estorno") whose amount,
 * regardless of how the source encoded it, must always settle as a positive
 * value (money returning to the user).
 */
const REFUND_KEYWORDS = [
  "estorno",
  "estornado",
  "estornada",
  "devolucao",
  "devolução",
  "reembolso",
  "refund",
  "reversal",
  "reversão",
  "reversao",
  "chargeback",
  "cashback",
];

export function isRefund(description: string | undefined | null): boolean {
  if (!description) return false;
  const lower = description.toLowerCase();
  return REFUND_KEYWORDS.some((kw) => lower.includes(kw));
}

export function normalizeRefundSign(
  description: string | undefined | null,
  amount: number,
): number {
  if (!Number.isFinite(amount)) return amount;
  if (isRefund(description)) return Math.abs(amount);
  return amount;
}
