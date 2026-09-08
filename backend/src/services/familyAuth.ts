import type { FamilyMemberRole } from "../types.js";
import { getUser } from "./userService.js";
import { getMember } from "./familyService.js";

export function isFamilyManager(role: FamilyMemberRole | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

export async function getFamilyRole(
  userId: string,
  familyId?: string,
): Promise<FamilyMemberRole | null> {
  if (!familyId) return null;
  const member = await getMember(familyId, userId);
  return member?.role ?? null;
}

export async function requireFamilyManager(
  userId: string,
): Promise<{ ok: true } | { ok: false; status: 403 | 404; error: string }> {
  const user = await getUser(userId);
  if (!user) return { ok: false, status: 404, error: "User not found" };
  if (!user.familyId) return { ok: true };

  const role = await getFamilyRole(userId, user.familyId);
  if (!isFamilyManager(role)) {
    return { ok: false, status: 403, error: "Only family owners and admins can do this" };
  }
  return { ok: true };
}
