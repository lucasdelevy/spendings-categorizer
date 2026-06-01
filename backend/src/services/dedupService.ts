import type { TransactionItem } from "../types.js";

const MAX_DATE_DISTANCE_DAYS = 10;
const MATCH_THRESHOLD = 0.2;

/**
 * Normalizes date strings from multiple formats to YYYY-MM-DD:
 *   - Bank CSV: DD/MM/YYYY
 *   - Card CSV: YYYY-MM-DD (already correct)
 *   - Pierre ISO: YYYY-MM-DDTHH:MM:SS.sssZ
 */
export function normalizeDate(dateStr: string): string {
  if (dateStr.includes("T")) {
    return dateStr.split("T")[0];
  }

  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3 && parts[0].length <= 2) {
      const [d, m, y] = parts;
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }

  return dateStr;
}

export function normalizeAmount(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function tokenize(s: string): Set<string> {
  const cleaned = s.toLowerCase().replace(/[^a-záàâãéèêíïóôõúüç0-9\s]/gi, " ");
  const words = cleaned.split(/\s+/).filter(Boolean);
  return new Set(words);
}

export function descriptionSimilarity(a: string, b: string): number {
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 && setB.size === 0) return 1;

  let intersection = 0;
  for (const w of setA) {
    if (setB.has(w)) intersection++;
  }
  const smaller = Math.min(setA.size, setB.size);
  return smaller === 0 ? 0 : intersection / smaller;
}

/** Absolute day difference between two YYYY-MM-DD date strings. */
export function daysBetween(a: string, b: string): number {
  const msA = Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10));
  const msB = Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10));
  return Math.round(Math.abs(msA - msB) / 86_400_000);
}

/**
 * Linear decay from 1.0 (same day) to 0.0 (MAX_DATE_DISTANCE_DAYS apart).
 * Returns 0 for dates further apart than the maximum.
 */
export function dateProximity(dateA: string, dateB: string): number {
  const diff = daysBetween(dateA, dateB);
  return Math.max(0, 1 - diff / MAX_DATE_DISTANCE_DAYS);
}

export interface DedupResult {
  newTransactions: TransactionItem[];
  duplicateCount: number;
}

/**
 * Finds which incoming transactions are duplicates of existing ones.
 *
 * Uses multiplicative composite scoring: matchScore = descSim * dateProximity.
 * This tolerates multi-day date drift (weekends, card processing, Open Finance
 * delays) while preventing false matches — zero description similarity or dates
 * too far apart both independently force the score to zero.
 *
 * Each existing transaction can only match one incoming transaction (consumed on match).
 */
export function findDuplicates(
  incoming: TransactionItem[],
  existing: TransactionItem[],
): DedupResult {
  const amountGroups = new Map<number, TransactionItem[]>();
  for (const tx of existing) {
    const amt = normalizeAmount(tx.amount);
    const group = amountGroups.get(amt);
    if (group) {
      group.push(tx);
    } else {
      amountGroups.set(amt, [tx]);
    }
  }

  const hiddenByAmount = new Map<number, TransactionItem[]>();
  for (const tx of existing) {
    if (tx.hidden) {
      const amt = normalizeAmount(tx.amount);
      const group = hiddenByAmount.get(amt);
      if (group) {
        group.push(tx);
      } else {
        hiddenByAmount.set(amt, [tx]);
      }
    }
  }

  const newTransactions: TransactionItem[] = [];
  let duplicateCount = 0;

  for (const tx of incoming) {
    const normDate = normalizeDate(tx.date);
    const normAmount = normalizeAmount(tx.amount);
    const candidates = amountGroups.get(normAmount);

    if (!candidates || candidates.length === 0) {
      const out = shouldInheritHidden(normDate, normAmount, hiddenByAmount)
        ? { ...tx, hidden: true }
        : tx;
      newTransactions.push(out);
      continue;
    }

    let bestCandidate: TransactionItem | null = null;
    let bestScore = -1;
    for (const cand of candidates) {
      const descSim = descriptionSimilarity(
        tx.originalDescription,
        cand.originalDescription,
      );
      const dateSim = dateProximity(normDate, normalizeDate(cand.date));
      const score = descSim * dateSim;
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = cand;
      }
    }

    if (bestScore >= MATCH_THRESHOLD && bestCandidate) {
      candidates.splice(candidates.indexOf(bestCandidate), 1);
      duplicateCount++;
    } else {
      const out = shouldInheritHidden(normDate, normAmount, hiddenByAmount)
        ? { ...tx, hidden: true }
        : tx;
      newTransactions.push(out);
    }
  }

  return { newTransactions, duplicateCount };
}

function shouldInheritHidden(
  normDate: string,
  normAmount: number,
  hiddenByAmount: Map<number, TransactionItem[]>,
): boolean {
  const hiddenTxs = hiddenByAmount.get(normAmount);
  if (!hiddenTxs) return false;
  return hiddenTxs.some(
    (h) => dateProximity(normDate, normalizeDate(h.date)) > 0,
  );
}
