import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { AppError } from "@/server/utils/errors";
import { findAllPermissionsForUser } from "@/server/repositories/permission.repository";
import { prisma } from "@/server/db/prisma";
import { z } from "zod";

// ─── Validation schema for PATCH body ─────────────────────────────────────────
// granted: true = explicitly grant, false = explicitly revoke, null = reset to role default
const updatePermissionSchema = z.object({
  permissionKey: z.string().min(1),
  granted: z.boolean().nullable(),
});

// ─── Shared error handler ──────────────────────────────────────────────────────
// Avoids repeating try/catch error formatting in every handler
function handleError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json({ message: error.message }, { status: error.statusCode });
  }
  // Cast to ZodError so TypeScript knows .errors exists on it
  if (error instanceof z.ZodError) {
    const zodErr = error as z.ZodError;
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }
  return NextResponse.json({ message: "Internal server error" }, { status: 500 });
}

// ─── GET /api/admin/permissions/[userId] ──────────────────────────────────────
// Returns all 12 permissions for a specific sub-admin with source info
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin("permission.manage");

    // Next.js 15 — params is a Promise, must await before accessing
    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, fullName: true, email: true },
    });

    if (!user) throw new AppError("User not found", 404);
    if (user.role !== "SUB_ADMIN") throw new AppError("User is not a sub-admin", 400);

    // Use repository from 6B — handles OVERRIDE vs ROLE_DEFAULT priority
    const permissions = await findAllPermissionsForUser(userId, user.role);

    return NextResponse.json({
      user: { id: user.id, fullName: user.fullName, email: user.email },
      permissions,
    });
  } catch (error) {
    return handleError(error);
  }
}

// ─── PATCH /api/admin/permissions/[userId] ────────────────────────────────────
// granted: true → explicitly grant, false → explicitly revoke, null → reset to role default
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin("permission.manage");

    // Next.js 15 — params is a Promise, must await before accessing
    const { userId } = await params;
    const body = await req.json();
    const { permissionKey, granted } = updatePermissionSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) throw new AppError("User not found", 404);
    if (user.role !== "SUB_ADMIN") throw new AppError("Can only manage SUB_ADMIN permissions", 400);

    const permission = await prisma.permission.findUnique({
      where: { key: permissionKey },
    });

    if (!permission) throw new AppError(`Unknown permission key: ${permissionKey}`, 400);

    if (granted === null) {
      // null = remove override entirely, revert to role default
      await prisma.userPermissionOverride.deleteMany({
        where: { userId, permissionId: permission.id },
      });
      return NextResponse.json({ message: "Override removed — reverted to role default" });
    }

    // Upsert override — creates if new, updates if already exists
    await prisma.userPermissionOverride.upsert({
      where: { userId_permissionId: { userId, permissionId: permission.id } },
      update: { granted },
      create: { userId, permissionId: permission.id, granted },
    });

    return NextResponse.json({
      message: `Permission "${permissionKey}" ${granted ? "granted" : "revoked"} for user`,
    });
  } catch (error) {
    return handleError(error);
  }
}