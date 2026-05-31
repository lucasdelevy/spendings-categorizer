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

function adjacentDates(isoDate: string): string[] {
  const d = new Date(isoDate + "T12:00:00Z");
  const prev = new Date(d.getTime() - 86_400_000);
  const next = new Date(d.getTime() + 86_400_000);
  const fmt = (dt: Date) =>
    `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
  return [isoDate, fmt(prev), fmt(next)];
}

/**
 * Finds which incoming transactions are duplicates of existing ones.
 * Uses (normalizedDate, normalizedAmount) grouping + description similarity.
 * Tolerates ±1 day difference to handle UTC vs local-time date mismatches
 * between CSV (bank UTC dates) and Pierre (local BRT dates).
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

  const hiddenKeys = new Set<string>();
  for (const tx of existing) {
    if (tx.hidden) {
      hiddenKeys.add(`${normalizeDate(tx.date)}|${normalizeAmount(tx.amount)}`);
    }
  }

  const newTransactions: TransactionItem[] = [];
  let duplicateCount = 0;

  for (const tx of incoming) {
    const normDate = normalizeDate(tx.date);
    const normAmount = normalizeAmount(tx.amount);
    const dates = adjacentDates(normDate);

    let allCandidates: { tx: TransactionItem; groupKey: string; idx: number }[] = [];
    for (const d of dates) {
      const key = `${d}|${normAmount}`;
      const group = groups.get(key);
      if (group) {
        for (let i = 0; i < group.length; i++) {
          allCandidates.push({ tx: group[i], groupKey: key, idx: i });
        }
      }
    }

    if (allCandidates.length === 0) {
      const isHidden = dates.some((d) => hiddenKeys.has(`${d}|${normAmount}`));
      const out = isHidden ? { ...tx, hidden: true } : tx;
      newTransactions.push(out);
      continue;
    }

    let bestEntry: (typeof allCandidates)[0] | null = null;
    let bestSim = -1;
    for (const entry of allCandidates) {
      const sim = descriptionSimilarity(
        tx.originalDescription,
        entry.tx.originalDescription,
      );
      if (sim > bestSim) {
        bestSim = sim;
        bestEntry = entry;
      }
    }

    if (bestSim >= SIMILARITY_THRESHOLD && bestEntry) {
      const group = groups.get(bestEntry.groupKey)!;
      group.splice(group.indexOf(bestEntry.tx), 1);
      duplicateCount++;
    } else {
      const isHidden = dates.some((d) => hiddenKeys.has(`${d}|${normAmount}`));
      const out = isHidden ? { ...tx, hidden: true } : tx;
      newTransactions.push(out);
    }
  }

  return { newTransactions, duplicateCount };
}
