import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { AppError } from "@/server/utils/errors";
import { prisma } from "@/server/db/prisma";

// ─── GET /api/admin/permissions ───────────────────────────────────────────────
// Returns all SUB_ADMIN users so the permissions page can list them
// Only ADMIN role can access — permission.manage required
export async function GET() {
  try {
    await requireAdmin("permission.manage");

    // Fetch all sub-admins — no password hash exposed
    const subAdmins = await prisma.user.findMany({
      where: { role: "SUB_ADMIN" },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
        permissionOverrides: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const formatted = subAdmins.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      createdAt: u.createdAt,
      overrideCount: u.permissionOverrides.length,
    }));

    return NextResponse.json({ subAdmins: formatted });
  } catch (error) {
    // AppError has a statusCode, unknown errors default to 500
    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}