import { describe, expect, it } from "vitest";
import {
  clampLimitAlertPercent,
  findLimitAlertBreaches,
  shiftYearMonth,
} from "./limitAlertService.js";
import type { CategoryEntry } from "../types.js";

const cats: Record<string, CategoryEntry> = {
  Moradia: { keywords: [], color: "#000", limit: { amount: 1000, period: "monthly" } },
  Carro: { keywords: [], color: "#000", limit: { amount: 500, period: "monthly" } },
  Padaria: { keywords: [], color: "#000" },
};

describe("clampLimitAlertPercent", () => {
  it("defaults to 80", () => {
    expect(clampLimitAlertPercent(undefined)).toBe(80);
    expect(clampLimitAlertPercent("nope")).toBe(80);
  });

  it("clamps to 1–100", () => {
    expect(clampLimitAlertPercent(0)).toBe(1);
    expect(clampLimitAlertPercent(150)).toBe(100);
    expect(clampLimitAlertPercent(80.4)).toBe(80);
  });
});

describe("findLimitAlertBreaches", () => {
  it("returns categories at or above the threshold", () => {
    const breaches = findLimitAlertBreaches(
      { Moradia: -850, Carro: -200, Padaria: -999 },
      cats,
      "202609",
      80,
    );
    expect(breaches.map((b) => b.category)).toEqual(["Moradia"]);
    expect(breaches[0].percent).toBe(85);
  });

  it("respects a custom threshold", () => {
    const breaches = findLimitAlertBreaches(
      { Moradia: -500, Carro: -200 },
      cats,
      "202609",
      40,
    );
    expect(breaches.map((b) => b.category).sort()).toEqual(["Carro", "Moradia"]);
  });

  it("skips categories without a limit", () => {
    const breaches = findLimitAlertBreaches({ Padaria: -10_000 }, cats, "202609", 80);
    expect(breaches).toEqual([]);
  });
});

describe("shiftYearMonth", () => {
  it("rolls across year boundaries", () => {
    expect(shiftYearMonth("202612", 1)).toBe("202701");
    expect(shiftYearMonth("202601", -1)).toBe("202512");
  });
});
