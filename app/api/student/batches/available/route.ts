import { requireAuth } from "@/server/auth/guards";
import { ok, fail } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { prisma } from "@/server/db/prisma";

function getStatusCode(error: unknown) {
  if (error instanceof AppError) return error.statusCode;
  if (error instanceof Error) {
    if (error.message === "Unauthorized") return 401;
    if (error.message === "Forbidden") return 403;
  }
  return 400;
}

/**
 * GET /api/student/batches/available
 *
 * Returns ACTIVE paid batches that the student is NOT yet
 * enrolled in (no StudentBatch AND no active Purchase).
 * These are batches the student can purchase.
 */
export async function GET() {
  try {
    const session = await requireAuth();

    if (session.role !== "STUDENT") {
      return fail("Only students can view available batches", 403);
    }

    // Get batch IDs the student already has access to
    const [studentBatches, activePurchases] = await Promise.all([
      prisma.studentBatch.findMany({
        where: { studentId: session.userId },
        select: { batchId: true },
      }),
      prisma.purchase.findMany({
        where: { userId: session.userId, status: "ACTIVE" },
        select: { batchId: true },
      }),
    ]);

    const enrolledBatchIds = new Set<string>([
      ...studentBatches.map((sb) => sb.batchId),
      ...activePurchases.map((p) => p.batchId),
    ]);

    // Find active paid batches NOT in enrolled set
    const availableBatches = await prisma.batch.findMany({
      where: {
        status: "ACTIVE",
        isPaid: true,
        id: { notIn: Array.from(enrolledBatchIds) },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        examType: true,
        description: true,
        isPaid: true,
        startDate: true,
        endDate: true,
        _count: {
          select: { testBatches: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(
      "Available batches fetched successfully",
      availableBatches.map((b) => ({
        ...b,
        linkedTestCount: b._count.testBatches,
      })),
      200
    );
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Failed to fetch available batches",
      getStatusCode(error)
    );
  }
}