import { scryptSync, timingSafeEqual } from "crypto";

export function hashPassword(password: string, saltHex: string): string {
  return scryptSync(password, saltHex, 64).toString("hex");
}

export function verifyPassword(password: string, saltHex: string, hashHex: string): boolean {
  const actual = Buffer.from(hashPassword(password, saltHex), "hex");
  const expected = Buffer.from(hashHex, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
