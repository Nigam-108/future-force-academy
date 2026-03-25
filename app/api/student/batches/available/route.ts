import { requireAuth } from "@/server/auth/guards";
import { ok, fail } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { prisma } from "@/server/db/prisma";
import { formatAmountFromPaise } from "@/server/repositories/payment.repository";

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
 * Returns ACTIVE batches the student is NOT yet enrolled in.
 * Includes both paid and free batches.
 */
export async function GET() {
  try {
    const session = await requireAuth();

    if (session.role !== "STUDENT") {
      return fail("Only students can view available batches", 403);
    }

    const [studentBatches, activePurchases] = await Promise.all([
      prisma.studentBatch.findMany({
        where: { studentId: session.userId },
        select: { batchId: true },
      }),
      prisma.purchase.findMany({
        where: {
          userId: session.userId,
          status: "ACTIVE",
        },
        select: { batchId: true },
      }),
    ]);

    const enrolledBatchIds = new Set([
      ...studentBatches.map((sb) => sb.batchId),
      ...activePurchases.map((p) => p.batchId),
    ]);

    // IMPORTANT CHANGE:
    // removed isPaid: true so free batches also appear
    const availableBatches = await prisma.batch.findMany({
      where: {
        status: "ACTIVE",
        id: { notIn: Array.from(enrolledBatchIds) },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        examType: true,
        description: true,
        isPaid: true,
        price: true,
        originalPrice: true,
        offerEndDate: true,
        startDate: true,
        endDate: true,
        testBatches: {
          select: {
            price: true,
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
          orderBy: { assignedAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const batchIds = availableBatches.map((b) => b.id);

    const existingTestPurchases =
      batchIds.length > 0
        ? await prisma.testPurchase.findMany({
            where: {
              userId: session.userId,
              batchId: { in: batchIds },
              status: "ACTIVE",
            },
            select: {
              testId: true,
              batchId: true,
            },
          })
        : [];

    const purchasedTestIds = new Set(
      existingTestPurchases.map((tp) => tp.testId)
    );

    const result = availableBatches.map((batch) => {
      const liveTests = batch.testBatches
        .filter((tb) => tb.test.visibilityStatus === "LIVE")
        .map((tb) => ({
          testId: tb.test.id,
          title: tb.test.title,
          slug: tb.test.slug,
          mode: tb.test.mode,
          totalQuestions: tb.test.totalQuestions,
          totalMarks: tb.test.totalMarks,
          durationInMinutes: tb.test.durationInMinutes,
          price: tb.price ?? 0,
          priceFormatted:
            tb.price && tb.price > 0 ? formatAmountFromPaise(tb.price) : "Free",
          isFree: !tb.price || tb.price === 0,
          alreadyPurchased: purchasedTestIds.has(tb.test.id),
        }));

      const paidTests = liveTests.filter((t) => !t.isFree && !t.alreadyPurchased);

      const totalIndividualPricePaise = paidTests.reduce(
        (sum, t) => sum + t.price,
        0
      );

      const discountPercent =
        batch.price != null && batch.originalPrice != null && batch.originalPrice > 0
          ? Math.round(
              ((batch.originalPrice - batch.price) / batch.originalPrice) * 100
            )
          : null;

      return {
        id: batch.id,
        title: batch.title,
        slug: batch.slug,
        examType: batch.examType,
        description: batch.description,
        isPaid: batch.isPaid,
        price: batch.isPaid ? batch.price : 0,
        originalPrice: batch.isPaid ? batch.originalPrice : null,
        offerEndDate: batch.isPaid ? batch.offerEndDate : null,
        priceFormatted: batch.isPaid
          ? batch.price != null
            ? formatAmountFromPaise(batch.price)
            : null
          : "Free",
        originalPriceFormatted:
          batch.isPaid && batch.originalPrice != null
            ? formatAmountFromPaise(batch.originalPrice)
            : null,
        discountPercent: batch.isPaid ? discountPercent : null,
        liveTests,
        totalTests: liveTests.length,
        paidTestCount: paidTests.length,
        totalIndividualPricePaise,
        totalIndividualPriceFormatted:
          totalIndividualPricePaise > 0
            ? formatAmountFromPaise(totalIndividualPricePaise)
            : null,
      };
    });

    return ok("Available batches fetched successfully", result, 200);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to fetch available batches",
      getStatusCode(error)
    );
  }
}