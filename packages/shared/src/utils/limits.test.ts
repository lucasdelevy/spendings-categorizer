import { describe, expect, it } from "vitest";
import { clampLimitAlertPercent, findLimitAlertBreaches } from "./limits";
import type { CategoryEntry } from "../types";

const cats: Record<string, CategoryEntry> = {
  Moradia: { keywords: [], color: "#000", limit: { amount: 1000, period: "monthly" } },
  Outros: { keywords: [], color: "#000" },
};

describe("clampLimitAlertPercent", () => {
  it("defaults to 80", () => {
    expect(clampLimitAlertPercent(undefined)).toBe(80);
  });
});

describe("findLimitAlertBreaches", () => {
  it("flags a category at the default 80% threshold", () => {
    const breaches = findLimitAlertBreaches({ Moradia: -800 }, cats, "202609");
    expect(breaches).toEqual([{ category: "Moradia", percent: 80, period: "monthly" }]);
  });

  it("ignores categories without a limit", () => {
    expect(findLimitAlertBreaches({ Outros: -9999 }, cats, "202609")).toEqual([]);
  });
});
