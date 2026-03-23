import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { ok, fail } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { reconcilePayment } from "@/server/services/razorpay.service";

function getStatusCode(error: unknown) {
  if (error instanceof AppError) return error.statusCode;
  if (error instanceof Error) {
    if (error.message === "Unauthorized") return 401;
    if (error.message === "Forbidden") return 403;
  }
  return 400;
}

type RouteContext = {
  params: Promise<{ paymentId: string }>;
};

/**
 * POST /api/admin/payments/[paymentId]/reconcile
 *
 * Fetches real-time status from Razorpay and syncs our DB.
 * Use when a payment is stuck in PENDING or webhook was missed.
 */
export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin("payment.manage");
    const { paymentId } = await context.params;
    const result = await reconcilePayment(paymentId);
    return ok("Reconciliation completed", result, 200);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Reconciliation failed",
      getStatusCode(error)
    );
  }
}