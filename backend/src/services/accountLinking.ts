import type { FamilyMemberRole } from "../types.js";

export type FamilyEmailMatch = {
  userId: string;
  role: FamilyMemberRole;
  joinedAt: string;
};

export type ScannedProfile = {
  userId: string;
  createdAt: string;
};

/**
 * Pick the surviving user when Google and Apple (or two family rows) share an email.
 * Prefer the family owner, then an admin, then the oldest family member, then the oldest
 * scanned profile, then an EMAILUSER link, then the current OAuth subject.
 */
export function pickCanonicalUserId(input: {
  oauthSub: string;
  emailLinkUserId: string | null;
  scannedProfiles: ScannedProfile[];
  familyMatches: FamilyEmailMatch[];
}): { canonicalId: string; duplicateIds: string[] } {
  const owner = input.familyMatches.find((m) => m.role === "owner");
  const admin = input.familyMatches.find((m) => m.role === "admin");
  const oldestMember = [...input.familyMatches].sort((a, b) =>
    a.joinedAt.localeCompare(b.joinedAt),
  )[0];
  const oldestScanned = [...input.scannedProfiles].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  )[0];

  const canonicalId =
    owner?.userId ??
    admin?.userId ??
    oldestMember?.userId ??
    oldestScanned?.userId ??
    input.emailLinkUserId ??
    input.oauthSub;

  const extras = new Set<string>();
  if (input.emailLinkUserId) extras.add(input.emailLinkUserId);
  for (const profile of input.scannedProfiles) extras.add(profile.userId);
  for (const member of input.familyMatches) extras.add(member.userId);
  extras.add(input.oauthSub);
  extras.delete(canonicalId);

  return { canonicalId, duplicateIds: [...extras] };
}

export function familyEmailMatches(
  members: Array<{
    SK: string;
    email: string;
    role: FamilyMemberRole;
    status: string;
    joinedAt: string;
  }>,
  email: string,
): FamilyEmailMatch[] {
  const normalized = email.trim().toLowerCase();
  return members
    .filter((member) => {
      if (member.status !== "active") return false;
      if (member.SK.includes("pending-")) return false;
      return member.email.trim().toLowerCase() === normalized;
    })
    .map((member) => ({
      userId: member.SK.replace("MEMBER#", ""),
      role: member.role,
      joinedAt: member.joinedAt,
    }));
}
