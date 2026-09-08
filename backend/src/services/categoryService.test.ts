import { describe, it, expect } from "vitest";
import type { CategoryConfigRecord } from "../types.js";
import { FALLBACK_CATEGORY, matchCategory } from "./categoryMatch.js";

function config(categories: Record<string, string[]>): CategoryConfigRecord {
  return {
    PK: "USER#test",
    SK: "CATCONFIG",
    categories: Object.fromEntries(
      Object.entries(categories).map(([name, keywords]) => [
        name,
        { keywords, color: "#000" },
      ]),
    ),
    ignore: [],
    rename: {},
    updatedAt: "",
  };
}

describe("matchCategory", () => {
  const cats = config({
    Alimentação: ["hayashi", "supermercado"],
    Compras: ["mercadolivre", "amazon"],
  });

  it("uses the longest matching keyword", () => {
    expect(matchCategory("Pagamento mercadolivre", cats)).toBe("Compras");
  });

  it("falls back to Sem Categoria when no keyword matches", () => {
    expect(matchCategory("UBER TRIP 123", cats)).toBe(FALLBACK_CATEGORY);
  });

  it("does not keep Pierre/Open Finance category names", () => {
    expect(matchCategory("UBER TRIP 123", cats, "Transportation")).toBe(
      FALLBACK_CATEGORY,
    );
  });

  it("keeps a manually assigned category that exists in config", () => {
    expect(matchCategory("UBER TRIP 123", cats, "Alimentação")).toBe("Alimentação");
  });

  it("keeps Sem Categoria when already assigned", () => {
    expect(matchCategory("UBER TRIP 123", cats, FALLBACK_CATEGORY)).toBe(
      FALLBACK_CATEGORY,
    );
  });
});
