import type { TransactionItem } from "../types.js";

const SIMILARITY_THRESHOLD = 0.3;

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

export interface DedupResult {
  newTransactions: TransactionItem[];
  duplicateCount: number;
}

/**
 * Finds which incoming transactions are duplicates of existing ones.
 * Uses (normalizedDate, normalizedAmount) grouping + description similarity.
 * Each existing transaction can only match one incoming transaction (consumed on match).
 */
export function findDuplicates(
  incoming: TransactionItem[],
  existing: TransactionItem[],
): DedupResult {
  const groups = new Map<string, TransactionItem[]>();
  for (const tx of existing) {
    const key = `${normalizeDate(tx.date)}|${normalizeAmount(tx.amount)}`;
    const group = groups.get(key);
    if (group) {
      group.push(tx);
    } else {
      groups.set(key, [tx]);
    }
  }

  const newTransactions: TransactionItem[] = [];
  let duplicateCount = 0;

  for (const tx of incoming) {
    const key = `${normalizeDate(tx.date)}|${normalizeAmount(tx.amount)}`;
    const candidates = groups.get(key);

    if (!candidates || candidates.length === 0) {
      newTransactions.push(tx);
      continue;
    }

    let bestIdx = -1;
    let bestSim = -1;
    for (let i = 0; i < candidates.length; i++) {
      const sim = descriptionSimilarity(
        tx.originalDescription,
        candidates[i].originalDescription,
      );
      if (sim > bestSim) {
        bestSim = sim;
        bestIdx = i;
      }
    }

    if (bestSim >= SIMILARITY_THRESHOLD) {
      candidates.splice(bestIdx, 1);
      duplicateCount++;
    } else {
      newTransactions.push(tx);
    }
  }

  return { newTransactions, duplicateCount };
}
