import { AppError } from "@/server/utils/errors";
import { findUserPermission } from "@/server/repositories/permission.repository";

// ─── Core permission check ────────────────────────────────────────────────────
// ADMIN role always passes — no need to check DB
// SUB_ADMIN role goes through full DB check
// Any other role → denied immediately
export async function userHasPermission(
  userId: string,
  role: string,
  permissionKey: string
): Promise<boolean> {
  // ADMIN bypasses all permission checks — main admin has full access
  if (role === "ADMIN") return true;

  // Only ADMIN and SUB_ADMIN can reach admin routes
  // But just in case, deny anything else
  if (role !== "SUB_ADMIN") return false;

  return findUserPermission(userId, role, permissionKey);
}

// ─── Assert permission — throws 403 if denied ─────────────────────────────────
// Use this inside route handlers after requireAdmin()
// Example: await assertPermission(session.userId, session.role, "question.manage")
export async function assertPermission(
  userId: string,
  role: string,
  permissionKey: string
): Promise<void> {
  const hasAccess = await userHasPermission(userId, role, permissionKey);

  if (!hasAccess) {
    throw new AppError(
      `Access denied — you do not have the "${permissionKey}" permission`,
      403
    );
  }
}