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
 * GET /api/student/payments/history
 *
 * Returns the student's own payment history — all attempts,
 * including failed and pending ones.
 */
export async function GET() {
  try {
    const session = await requireAuth();

    if (session.role !== "STUDENT") {
      return fail("Only students can view their payment history", 403);
    }

    const payments = await prisma.payment.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        gateway: true,
        orderId: true,
        paymentId: true,
        notes: true,
        paidAt: true,
        createdAt: true,
        batch: {
          select: {
            id: true,
            title: true,
            examType: true,
            isPaid: true,
          },
        },
      },
    });

    return ok(
      "Payment history fetched successfully",
      payments.map((p) => ({
        ...p,
        amountFormatted: formatAmountFromPaise(p.amount),
      })),
      200
    );
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to fetch payment history",
      getStatusCode(error)
    );
  }
}