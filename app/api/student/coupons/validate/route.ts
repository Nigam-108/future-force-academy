import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guards";
import { ok, fail } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { validateCoupon } from "@/server/services/coupon.service";
import { validateCouponSchema } from "@/server/validations/coupon.schema";
import { calculateBatchPrice } from "@/server/services/pricing.service";

function getStatusCode(error: unknown) {
  if (error instanceof AppError) return error.statusCode;
  if (error instanceof Error) {
    if (error.message === "Unauthorized") return 401;
    if (error.message === "Forbidden") return 403;
  }
  return 400;
}

/**
 * POST /api/student/coupons/validate
 *
 * Validates a coupon code against a specific batch.
 * Returns pricing breakdown with/without discount.
 * Called before creating a payment order.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    if (session.role !== "STUDENT") {
      return fail("Only students can validate coupons", 403);
    }

    const body = await request.json();
    const parsed = validateCouponSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    // Get batch price first
    const batchPricing = await calculateBatchPrice(parsed.data.batchId);

    // Validate the coupon
    const result = await validateCoupon(
      parsed.data.code,
      parsed.data.batchId,
      session.userId,
      batchPricing.amountPaise
    );

    if (!result.valid) {
      return fail(result.reason, 400);
    }

    return ok("Coupon is valid", result, 200);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Coupon validation failed",
      getStatusCode(error)
    );
  }
}