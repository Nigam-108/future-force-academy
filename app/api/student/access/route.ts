import { requireAuth } from "@/server/auth/guards";
import { ok, fail } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { getStudentAccessibleBatchIds } from "@/server/services/access.service";
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
 * GET /api/student/access
 *
 * Returns a summary of the student's batch access —
 * which batches they can access and via which path.
 */
export async function GET() {
  try {
    const session = await requireAuth();

    if (session.role !== "STUDENT") {
      return fail("Only students can view access summary", 403);
    }

    const accessibleBatchIds = await getStudentAccessibleBatchIds(
      session.userId
    );

    // Fetch batch details for the accessible ones
    const batches = await prisma.batch.findMany({
      where: {
        id: { in: accessibleBatchIds },
        status: "ACTIVE",
      },
      select: {
        id: true,
        title: true,
        slug: true,
        examType: true,
        isPaid: true,
        // Check which path gives access
        studentBatches: {
          where: { studentId: session.userId },
          select: { id: true, assignedAt: true },
        },
        purchases: {
          where: {
            userId: session.userId,
            status: "ACTIVE",
          },
          select: {
            id: true,
            validFrom: true,
            validUntil: true,
            payment: {
              select: {
                gateway: true,
                amount: true,
              },
            },
          },
        },
        // Count linked tests
        testBatches: {
          select: {
            test: {
              select: {
                id: true,
                title: true,
                slug: true,
                mode: true,
                visibilityStatus: true,
                totalQuestions: true,
                totalMarks: true,
                durationInMinutes: true,
              },
            },
          },
        },
      },
    });

    const summary = batches.map((batch) => ({
      batchId: batch.id,
      batchTitle: batch.title,
      examType: batch.examType,
      isPaid: batch.isPaid,
      accessPath:
        batch.studentBatches.length > 0 && batch.purchases.length > 0
          ? "BOTH"
          : batch.studentBatches.length > 0
          ? "ADMIN_ASSIGNED"
          : "PURCHASED",
      assignedAt: batch.studentBatches[0]?.assignedAt ?? null,
      purchase: batch.purchases[0] ?? null,
      linkedTests: batch.testBatches
        .map((tb) => tb.test)
        .filter((t) => t.visibilityStatus === "LIVE"),
      totalLinkedTests: batch.testBatches.length,
    }));

    return ok(
      "Student access summary fetched successfully",
      {
        totalAccessibleBatches: summary.length,
        batches: summary,
      },
      200
    );
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to fetch access summary",
      getStatusCode(error)
    );
  }
}