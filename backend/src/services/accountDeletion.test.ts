import { describe, expect, it } from "vitest";
import { chooseFamilySuccessor } from "./accountDeletion.js";
import type { FamilyMemberRecord } from "../types.js";

function member(
  userId: string,
  overrides: Partial<FamilyMemberRecord> = {},
): FamilyMemberRecord {
  return {
    PK: "FAMILY#f1",
    SK: `MEMBER#${userId}`,
    email: `${userId}@example.com`,
    name: userId,
    picture: "",
    role: "member",
    status: "active",
    joinedAt: "",
    ...overrides,
  };
}

describe("chooseFamilySuccessor", () => {
  it("picks another active member", () => {
    const owner = member("owner", { role: "owner" });
    const other = member("other");
    expect(chooseFamilySuccessor([owner, other], "owner")?.SK).toBe("MEMBER#other");
  });

  it("skips pending invites", () => {
    const owner = member("owner", { role: "owner" });
    const pending = member("pending-abc", { status: "pending", SK: "MEMBER#pending-abc" });
    expect(chooseFamilySuccessor([owner, pending], "owner")).toBeNull();
  });
});
