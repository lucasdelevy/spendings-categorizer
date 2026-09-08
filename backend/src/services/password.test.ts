import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

describe("password", () => {
  it("accepts the matching password and rejects others", () => {
    const salt = "75008409503cd47b6f7197372bf25b60";
    const hash = hashPassword("admin123", salt);
    expect(verifyPassword("admin123", salt, hash)).toBe(true);
    expect(verifyPassword("wrong", salt, hash)).toBe(false);
  });
});
