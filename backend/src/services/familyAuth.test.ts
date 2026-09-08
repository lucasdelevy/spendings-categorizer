import { describe, expect, it } from "vitest";
import { isFamilyManager } from "./familyAuth.js";

describe("isFamilyManager", () => {
  it("treats owner and admin as managers", () => {
    expect(isFamilyManager("owner")).toBe(true);
    expect(isFamilyManager("admin")).toBe(true);
  });

  it("rejects members and missing roles", () => {
    expect(isFamilyManager("member")).toBe(false);
    expect(isFamilyManager(null)).toBe(false);
    expect(isFamilyManager(undefined)).toBe(false);
  });
});
