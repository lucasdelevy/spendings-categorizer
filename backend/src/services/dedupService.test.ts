import { describe, it, expect } from "vitest";
import type { TransactionItem } from "../types.js";
import {
  normalizeDate,
  normalizeAmount,
  descriptionSimilarity,
  daysBetween,
  dateProximity,
  findDuplicates,
} from "./dedupService.js";

function tx(
  overrides: Partial<TransactionItem> & Pick<TransactionItem, "date" | "amount" | "originalDescription">,
): TransactionItem {
  return {
    category: "Outros",
    payee: overrides.originalDescription,
    installment: "",
    ...overrides,
  };
}

describe("normalizeDate", () => {
  it("strips time from ISO strings", () => {
    expect(normalizeDate("2026-04-15T19:52:33.410Z")).toBe("2026-04-15");
  });

  it("converts DD/MM/YYYY to YYYY-MM-DD", () => {
    expect(normalizeDate("03/04/2026")).toBe("2026-04-03");
  });

  it("pads single-digit day and month", () => {
    expect(normalizeDate("1/3/2026")).toBe("2026-03-01");
  });

  it("returns YYYY-MM-DD unchanged", () => {
    expect(normalizeDate("2026-04-15")).toBe("2026-04-15");
  });
});

describe("normalizeAmount", () => {
  it("rounds to two decimal places", () => {
    expect(normalizeAmount(45.905)).toBe(45.91);
    expect(normalizeAmount(-100)).toBe(-100);
  });
});

describe("descriptionSimilarity", () => {
  it("returns 1 for identical strings", () => {
    expect(descriptionSimilarity("Panificadorapark", "Panificadorapark")).toBe(1);
  });

  it("returns 0 for completely different strings", () => {
    expect(descriptionSimilarity("Supermercado Extra", "Netflix Premium")).toBe(0);
  });

  it("matches partial overlap", () => {
    const sim = descriptionSimilarity(
      "Transferência enviada|VIBRA ENERGIA S.A",
      "PIX ENVIADO - VIBRA ENERGIA",
    );
    expect(sim).toBeGreaterThan(0.3);
  });
});

describe("daysBetween", () => {
  it("returns 0 for same date", () => {
    expect(daysBetween("2026-04-15", "2026-04-15")).toBe(0);
  });

  it("returns correct difference", () => {
    expect(daysBetween("2026-04-10", "2026-04-15")).toBe(5);
  });

  it("is symmetric", () => {
    expect(daysBetween("2026-04-15", "2026-04-10")).toBe(5);
  });

  it("works across month boundaries", () => {
    expect(daysBetween("2026-03-30", "2026-04-02")).toBe(3);
  });
});

describe("dateProximity", () => {
  it("returns 1.0 for same day", () => {
    expect(dateProximity("2026-04-15", "2026-04-15")).toBe(1);
  });

  it("returns 0.5 for 5 days apart", () => {
    expect(dateProximity("2026-04-10", "2026-04-15")).toBe(0.5);
  });

  it("returns 0 for 10+ days apart", () => {
    expect(dateProximity("2026-04-01", "2026-04-15")).toBe(0);
  });
});

describe("findDuplicates", () => {
  it("detects exact duplicate (same date, same amount, same description)", () => {
    const existing = [tx({ date: "2026-04-15", amount: -50, originalDescription: "Panificadorapark" })];
    const incoming = [tx({ date: "2026-04-15", amount: -50, originalDescription: "Panificadorapark" })];

    const result = findDuplicates(incoming, existing);
    expect(result.duplicateCount).toBe(1);
    expect(result.newTransactions).toHaveLength(0);
  });

  it("detects duplicate with 1-day drift", () => {
    const existing = [tx({ date: "2026-04-15", amount: -50, originalDescription: "Panificadorapark" })];
    const incoming = [tx({ date: "2026-04-16", amount: -50, originalDescription: "Panificadorapark" })];

    const result = findDuplicates(incoming, existing);
    expect(result.duplicateCount).toBe(1);
    expect(result.newTransactions).toHaveLength(0);
  });

  it("detects duplicate with 3-day drift and good description match", () => {
    const existing = [tx({
      date: "2026-04-12",
      amount: -278.64,
      originalDescription: "PIX ENVIADO - VIBRA ENERGIA",
    })];
    const incoming = [tx({
      date: "2026-04-15",
      amount: -278.64,
      originalDescription: "Transferência enviada|VIBRA ENERGIA S.A",
    })];

    const result = findDuplicates(incoming, existing);
    expect(result.duplicateCount).toBe(1);
    expect(result.newTransactions).toHaveLength(0);
  });

  it("detects duplicate with 5-day drift and exact description", () => {
    const existing = [tx({ date: "2026-04-10", amount: -100, originalDescription: "ARAUTOS DO EVANGELHO" })];
    const incoming = [tx({ date: "2026-04-15", amount: -100, originalDescription: "ARAUTOS DO EVANGELHO" })];

    const result = findDuplicates(incoming, existing);
    expect(result.duplicateCount).toBe(1);
    expect(result.newTransactions).toHaveLength(0);
  });

  it("does NOT false-match same amount, same date, different merchant", () => {
    const existing = [tx({ date: "2026-04-15", amount: -50, originalDescription: "Panificadorapark" })];
    const incoming = [tx({ date: "2026-04-15", amount: -50, originalDescription: "Cascol Combustiveis" })];

    const result = findDuplicates(incoming, existing);
    expect(result.duplicateCount).toBe(0);
    expect(result.newTransactions).toHaveLength(1);
  });

  it("does NOT false-match same amount, 5 days apart, low similarity", () => {
    const existing = [tx({ date: "2026-04-10", amount: -50, originalDescription: "Panificadorapark" })];
    const incoming = [tx({ date: "2026-04-15", amount: -50, originalDescription: "Cascol Combustiveis" })];

    const result = findDuplicates(incoming, existing);
    expect(result.duplicateCount).toBe(0);
    expect(result.newTransactions).toHaveLength(1);
  });

  it("does NOT match when dates are 10+ days apart even with identical description", () => {
    const existing = [tx({ date: "2026-04-01", amount: -100, originalDescription: "ARAUTOS DO EVANGELHO" })];
    const incoming = [tx({ date: "2026-04-15", amount: -100, originalDescription: "ARAUTOS DO EVANGELHO" })];

    const result = findDuplicates(incoming, existing);
    expect(result.duplicateCount).toBe(0);
    expect(result.newTransactions).toHaveLength(1);
  });

  it("picks the best candidate when multiple exist", () => {
    const existing = [
      tx({ date: "2026-04-14", amount: -50, originalDescription: "Supermercado Extra" }),
      tx({ date: "2026-04-15", amount: -50, originalDescription: "Panificadorapark" }),
    ];
    const incoming = [tx({ date: "2026-04-15", amount: -50, originalDescription: "Panificadorapark" })];

    const result = findDuplicates(incoming, existing);
    expect(result.duplicateCount).toBe(1);
    expect(result.newTransactions).toHaveLength(0);
  });

  it("consumes matches — second identical incoming is not a duplicate", () => {
    const existing = [tx({ date: "2026-04-15", amount: -50, originalDescription: "Panificadorapark" })];
    const incoming = [
      tx({ date: "2026-04-15", amount: -50, originalDescription: "Panificadorapark" }),
      tx({ date: "2026-04-15", amount: -50, originalDescription: "Panificadorapark" }),
    ];

    const result = findDuplicates(incoming, existing);
    expect(result.duplicateCount).toBe(1);
    expect(result.newTransactions).toHaveLength(1);
  });

  it("lets through transactions with no amount match at all", () => {
    const existing = [tx({ date: "2026-04-15", amount: -50, originalDescription: "Panificadorapark" })];
    const incoming = [tx({ date: "2026-04-15", amount: -99.99, originalDescription: "Something new" })];

    const result = findDuplicates(incoming, existing);
    expect(result.duplicateCount).toBe(0);
    expect(result.newTransactions).toHaveLength(1);
  });

  it("handles DD/MM/YYYY vs YYYY-MM-DD date formats", () => {
    const existing = [tx({ date: "15/04/2026", amount: -50, originalDescription: "Panificadorapark" })];
    const incoming = [tx({ date: "2026-04-15", amount: -50, originalDescription: "Panificadorapark" })];

    const result = findDuplicates(incoming, existing);
    expect(result.duplicateCount).toBe(1);
    expect(result.newTransactions).toHaveLength(0);
  });

  describe("hidden propagation", () => {
    it("propagates hidden flag when amount matches a hidden existing tx within date range", () => {
      const existing = [tx({ date: "2026-04-15", amount: -50, originalDescription: "Old hidden tx", hidden: true })];
      const incoming = [tx({ date: "2026-04-17", amount: -50, originalDescription: "Completely new merchant" })];

      const result = findDuplicates(incoming, existing);
      expect(result.newTransactions).toHaveLength(1);
      expect(result.newTransactions[0].hidden).toBe(true);
    });

    it("does NOT propagate hidden when date gap exceeds max distance", () => {
      const existing = [tx({ date: "2026-04-01", amount: -50, originalDescription: "Old hidden tx", hidden: true })];
      const incoming = [tx({ date: "2026-04-15", amount: -50, originalDescription: "Completely new merchant" })];

      const result = findDuplicates(incoming, existing);
      expect(result.newTransactions).toHaveLength(1);
      expect(result.newTransactions[0].hidden).toBeUndefined();
    });

    it("does NOT propagate hidden when amounts differ", () => {
      const existing = [tx({ date: "2026-04-15", amount: -50, originalDescription: "Hidden tx", hidden: true })];
      const incoming = [tx({ date: "2026-04-15", amount: -75, originalDescription: "New tx" })];

      const result = findDuplicates(incoming, existing);
      expect(result.newTransactions).toHaveLength(1);
      expect(result.newTransactions[0].hidden).toBeUndefined();
    });
  });
});
