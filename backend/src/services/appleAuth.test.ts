import { describe, expect, it } from "vitest";
import { verifyAppleIdentityToken } from "./appleAuth.js";

describe("verifyAppleIdentityToken", () => {
  it("rejects a malformed token", async () => {
    await expect(verifyAppleIdentityToken("not-a-jwt")).rejects.toThrow();
  });
});
