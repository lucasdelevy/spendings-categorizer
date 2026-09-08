export type FamilyRole = "owner" | "admin" | "member" | null;

export interface FamilyAuthUser {
  familyId: string | null;
  familyRole?: FamilyRole;
}

export function canManageFamily(user: FamilyAuthUser | null): boolean {
  if (!user?.familyId) return true;
  return user.familyRole === "owner" || user.familyRole === "admin";
}

export function isFamilyOwner(user: FamilyAuthUser | null): boolean {
  return !!user?.familyId && user.familyRole === "owner";
}
