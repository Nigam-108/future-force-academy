import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { AppError } from "@/server/utils/errors";
import { blockStudent } from "@/server/services/student.service";
import { prisma } from "@/server/db/prisma";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // student.manage permission required — blocks are a sensitive action
    const session = await requireAdmin("student.manage");

    // Next.js 15 — params is a Promise
    const { id: studentId } = await params;

    // Fetch admin fullName for activity log — SessionPayload only has userId
    const adminUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { fullName: true },
    });

    const result = await blockStudent(
      studentId,
      session.userId,
      adminUser?.fullName ?? "Admin"
    );

    return NextResponse.json({ message: "Student blocked successfully", data: result });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}