import { describe, expect, it } from "vitest";
import { isReviewLogin } from "./reviewAccount.js";

describe("isReviewLogin", () => {
  it("accepts the App Review email and password", () => {
    expect(isReviewLogin("test@aletheia.com", "admin123")).toBe(true);
    expect(isReviewLogin("  TEST@ALETHEIA.COM  ", "admin123")).toBe(true);
  });

  it("rejects other credentials", () => {
    expect(isReviewLogin("test@aletheia.com", "wrong")).toBe(false);
    expect(isReviewLogin("other@aletheia.com", "admin123")).toBe(false);
    expect(isReviewLogin("test@aletheia.com", "")).toBe(false);
  });
});
