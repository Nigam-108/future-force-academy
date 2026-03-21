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

export async function GET() {
  try {
    const session = await requireAuth();

    if (session.role !== "STUDENT") {
      return fail("Only students can view their purchases", 403);
    }

    const purchases = await prisma.purchase.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      include: {
        batch: {
          select: {
            id: true,
            title: true,
            slug: true,
            examType: true,
            isPaid: true,
            status: true,
            color: true,
            // Include linked LIVE tests
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
                    structureType: true,
                  },
                },
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            gateway: true,
            paidAt: true,
          },
        },
      },
    });

    const mapped = purchases.map((purchase) => ({
      id: purchase.id,
      status: purchase.status,
      validFrom: purchase.validFrom,
      validUntil: purchase.validUntil,
      createdAt: purchase.createdAt,
      isActive: purchase.status === "ACTIVE",
      isExpired:
        purchase.status === "EXPIRED" ||
        (purchase.validUntil !== null &&
          new Date() > new Date(purchase.validUntil)),
      batch: {
        id: purchase.batch.id,
        title: purchase.batch.title,
        slug: purchase.batch.slug,
        examType: purchase.batch.examType,
        isPaid: purchase.batch.isPaid,
        status: purchase.batch.status,
        color: purchase.batch.color,
      },
      // Only show LIVE tests to students
      linkedTests: purchase.batch.testBatches
        .map((tb) => tb.test)
        .filter((t) => t.visibilityStatus === "LIVE"),
      totalLinkedTests: purchase.batch.testBatches.length,
      payment: purchase.payment,
    }));

    return ok("Student purchases fetched successfully", mapped, 200);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to fetch purchases",
      getStatusCode(error)
    );
  }
}