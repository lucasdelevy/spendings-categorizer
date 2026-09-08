import { describe, expect, it } from "vitest";
import { familyEmailMatches, pickCanonicalUserId } from "./accountLinking.js";

describe("pickCanonicalUserId", () => {
  it("prefers the family owner over an EMAILUSER pointing at the Apple duplicate", () => {
    const result = pickCanonicalUserId({
      oauthSub: "apple-sub",
      emailLinkUserId: "apple-sub",
      scannedProfiles: [],
      familyMatches: [
        { userId: "google-sub", role: "owner", joinedAt: "2024-01-01" },
        { userId: "apple-sub", role: "member", joinedAt: "2026-09-08" },
      ],
    });
    expect(result.canonicalId).toBe("google-sub");
    expect(result.duplicateIds).toEqual(["apple-sub"]);
  });

  it("uses EMAILUSER when there is no family row yet", () => {
    const result = pickCanonicalUserId({
      oauthSub: "apple-sub",
      emailLinkUserId: "google-sub",
      scannedProfiles: [],
      familyMatches: [],
    });
    expect(result.canonicalId).toBe("google-sub");
    expect(result.duplicateIds).toEqual(["apple-sub"]);
  });

  it("uses the oldest scanned profile when EMAILUSER was never written", () => {
    const result = pickCanonicalUserId({
      oauthSub: "apple-sub",
      emailLinkUserId: null,
      scannedProfiles: [
        { userId: "google-sub", createdAt: "2024-01-01T00:00:00.000Z" },
      ],
      familyMatches: [],
    });
    expect(result.canonicalId).toBe("google-sub");
    expect(result.duplicateIds).toEqual(["apple-sub"]);
  });

  it("keeps a brand-new OAuth subject", () => {
    const result = pickCanonicalUserId({
      oauthSub: "new-sub",
      emailLinkUserId: null,
      scannedProfiles: [],
      familyMatches: [],
    });
    expect(result).toEqual({ canonicalId: "new-sub", duplicateIds: [] });
  });
});

describe("familyEmailMatches", () => {
  it("returns active members with the same email and skips pending invites", () => {
    const matches = familyEmailMatches(
      [
        {
          SK: "MEMBER#google-sub",
          email: "Me@Example.com",
          role: "owner",
          status: "active",
          joinedAt: "2024-01-01",
        },
        {
          SK: "MEMBER#apple-sub",
          email: "me@example.com",
          role: "member",
          status: "active",
          joinedAt: "2026-09-08",
        },
        {
          SK: "MEMBER#pending-abc",
          email: "me@example.com",
          role: "member",
          status: "pending",
          joinedAt: "2026-09-08",
        },
      ],
      "me@example.com",
    );
    expect(matches.map((m) => m.userId)).toEqual(["google-sub", "apple-sub"]);
  });
});
