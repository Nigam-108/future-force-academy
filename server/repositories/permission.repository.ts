import { prisma } from "@/server/db/prisma";

// ─── Check if a user has a specific permission ────────────────────────────────
// Priority order:
// 1. If ADMIN role → always true (handled in service, not here)
// 2. UserPermissionOverride — user-specific grant or revoke takes highest priority
// 3. RolePermission — default for their role (SUB_ADMIN defaults)
// 4. If nothing found → denied (false)
export async function findUserPermission(
  userId: string,
  role: string,
  permissionKey: string
): Promise<boolean> {
  // Step 1 — find the permission record by key
  const permission = await prisma.permission.findUnique({
    where: { key: permissionKey },
    select: { id: true },
  });

  // Permission key doesn't even exist in DB → deny
  if (!permission) return false;

  // Step 2 — check user-specific override first (highest priority)
  const userOverride = await prisma.userPermissionOverride.findUnique({
    where: {
      userId_permissionId: { userId, permissionId: permission.id },
    },
    select: { granted: true },
  });

  // Override exists → use it directly (could be true or false)
  if (userOverride !== null) return userOverride.granted;

  // Step 3 — fall back to role-based default
  const rolePermission = await prisma.rolePermission.findUnique({
    where: {
      role_permissionId: {
        role: role as "ADMIN" | "SUB_ADMIN" | "STUDENT",
        permissionId: permission.id,
      },
    },
    select: { granted: true },
  });

  // Role permission exists → use it
  if (rolePermission !== null) return rolePermission.granted;

  // Nothing found → deny by default
  return false;
}

// ─── Get all permissions for a user (used by 6C permission UI) ───────────────
export async function findAllPermissionsForUser(userId: string, role: string) {
  const permissions = await prisma.permission.findMany({
    orderBy: { key: "asc" },
    include: {
      rolePermissions: {
        where: { role: role as "ADMIN" | "SUB_ADMIN" | "STUDENT" },
      },
      userOverrides: {
        where: { userId },
      },
    },
  });

  return permissions.map((perm) => {
    const override = perm.userOverrides[0];
    const roleDefault = perm.rolePermissions[0];

    // Override takes priority over role default
    const effective = override?.granted ?? roleDefault?.granted ?? false;

    return {
      id: perm.id,
      key: perm.key,
      label: perm.label,
      description: perm.description,
      granted: effective,
      source: override ? "OVERRIDE" : roleDefault ? "ROLE_DEFAULT" : "DENIED",
    };
  });
}