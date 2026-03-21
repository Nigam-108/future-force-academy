import { requireAdmin } from "@/server/auth/guards";
import { ok, fail } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { prisma } from "@/server/db/prisma";
import { reconcilePayment } from "@/server/services/razorpay.service";

function getStatusCode(error: unknown) {
  if (error instanceof AppError) return error.statusCode;
  if (error instanceof Error) {
    if (error.message === "Unauthorized") return 401;
    if (error.message === "Forbidden") return 403;
  }
  return 400;
}

/**
 * POST /api/admin/payments/reconcile-all
 *
 * Reconciles ALL stuck PENDING Razorpay payments in one go.
 * Useful after webhook downtime or deployment gaps.
 *
 * Skips MANUAL payments — only processes RAZORPAY ones.
 * Skips payments newer than 5 minutes — give them time to complete.
 */
export async function POST() {
  try {
    await requireAdmin();

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: "PENDING",
        gateway: "RAZORPAY",
        orderId: { not: null },
        createdAt: { lt: fiveMinutesAgo },
      },
      select: { id: true },
    });

    if (pendingPayments.length === 0) {
      return ok(
        "No stuck payments found",
        {
          total: 0,
          updated: 0,
          failed: 0,
          results: [],
        },
        200
      );
    }

    // Process sequentially to avoid Razorpay rate limits
    const results: Array<{
      paymentId: string;
      changed: boolean;
      newStatus: string;
      message: string;
      error?: string;
    }> = [];

    let updatedCount = 0;
    let failedCount = 0;

    for (const payment of pendingPayments) {
      try {
        const result = await reconcilePayment(payment.id);
        results.push({
          paymentId: payment.id,
          changed: result.changed,
          newStatus: result.newStatus,
          message: result.message,
        });
        if (result.changed) updatedCount++;
      } catch (error) {
        failedCount++;
        results.push({
          paymentId: payment.id,
          changed: false,
          newStatus: "PENDING",
          message: "Reconciliation failed",
          error:
            error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return ok(
      `Reconciled ${pendingPayments.length} payment(s) — ${updatedCount} updated`,
      {
        total: pendingPayments.length,
        updated: updatedCount,
        failed: failedCount,
        results,
      },
      200
    );
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Bulk reconciliation failed",
      getStatusCode(error)
    );
  }
}