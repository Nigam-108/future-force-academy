import { getSessionCookie } from "@/server/auth/cookies";
import { verifySessionToken } from "@/server/auth/jwt";
import { AppError } from "@/server/utils/errors";
import { assertPermission } from "@/server/services/permission.service";

export async function requireAuth() {
  const token = await getSessionCookie();

  if (!token) {
    throw new AppError("Unauthorized", 401);
  }

  return verifySessionToken(token);
}

// ─── requireAdmin — upgraded for 6B ──────────────────────────────────────────
// OLD behavior (no permissionKey): just checks role is ADMIN or SUB_ADMIN
// NEW behavior (with permissionKey): also checks SUB_ADMIN has that permission
//
// ADMIN role always bypasses permission check
// SUB_ADMIN role is checked against DB (RolePermission + UserPermissionOverride)
//
// Usage:
//   await requireAdmin()                        ← no permission check (backwards compatible)
//   await requireAdmin("question.manage")       ← checks permission for sub-admins
export async function requireAdmin(permissionKey?: string) {
  const session = await requireAuth();

  if (session.role !== "ADMIN" && session.role !== "SUB_ADMIN") {
    throw new AppError("Forbidden", 403);
  }

  // Only run permission check if a key was provided AND user is SUB_ADMIN
  // ADMIN always passes through
  if (permissionKey && session.role === "SUB_ADMIN") {
    await assertPermission(session.userId, session.role, permissionKey);
  }

  return session;
}