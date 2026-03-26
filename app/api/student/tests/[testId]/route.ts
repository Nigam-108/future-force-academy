import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guards";
import { ok, fail } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { prisma } from "@/server/db/prisma";
import { TestMode, TestVisibilityStatus } from "@prisma/client";
import { studentHasTestAccess } from "@/server/services/access.service";

function deriveStudentTestStatus(test: {
  mode: TestMode;
  startAt: Date | null;
  endAt: Date | null;
}) {
  const now = new Date();

  if (test.mode === TestMode.PRACTICE) return "AVAILABLE";

  if (test.mode === TestMode.LIVE) {
    if (test.startAt && now < test.startAt) return "UPCOMING";
    if (test.endAt && now > test.endAt) return "COMPLETED";
    return "LIVE";
  }

  if (test.mode === TestMode.ASSIGNED) {
    if (test.startAt && now < test.startAt) return "UPCOMING";
    if (test.endAt && now > test.endAt) return "COMPLETED";
    return "AVAILABLE";
  }

  return "AVAILABLE";
}

type RouteContext = {
  params: Promise<{ testId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAuth();

    if (session.role !== "STUDENT") {
      return fail("Only students can view tests", 403);
    }

    const { testId } = await context.params;

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        sections: { orderBy: { displayOrder: "asc" } },
        _count: { select: { testQuestions: true } },
        testBatches: {
  select: {
    batchId: true,
    batch: {
      select: {
        id: true,
        status: true,
        isPaid: true,
      },
    },
  },
},
      },
    });

    if (!test) {
      throw new AppError("Test not found", 404);
    }

    if (test.visibilityStatus !== TestVisibilityStatus.LIVE) {
      throw new AppError("Test is not available", 403);
    }

    // Batch-access check — delegates to access.service.ts
    if (test.testBatches.length > 0) {
      const activeBatches = test.testBatches.filter(
        (tb) => tb.batch.status === "ACTIVE"
      );

      if (activeBatches.length === 0) {
        throw new AppError(
          "This test is currently unavailable — all linked batches are closed.",
          403
        );
      }

      const hasAccess = await studentHasTestAccess(
        session.userId,
        testId,
        test.testBatches.map((tb) => ({
          batchId: tb.batchId,
          batch: { id: tb.batch.id, status: tb.batch.status },
        }))
      );

      if (!hasAccess) {
        throw new AppError(
          "You do not have access to this test. Please purchase or contact your admin.",
          403
        );
      }
    }

    const studentStatus = deriveStudentTestStatus(test);

    // Strip internal batch data from student-facing response
    const { testBatches: _testBatches, ...testData } = test;

    return ok("Test fetched successfully", { ...testData, studentStatus }, 200);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch test";
    const status = error instanceof AppError ? error.statusCode : 400;
    return fail(message, status);
  }
}