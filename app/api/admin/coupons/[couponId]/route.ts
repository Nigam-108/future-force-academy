import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { ok, fail } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import {
  getCouponDetail,
  toggleCoupon,
  updateCoupon,
} from "@/server/services/coupon.service";
import {
  toggleCouponSchema,
  updateCouponSchema,
} from "@/server/validations/coupon.schema";

function getStatusCode(error: unknown) {
  if (error instanceof AppError) return error.statusCode;
  if (error instanceof Error) {
    if (error.message === "Unauthorized") return 401;
    if (error.message === "Forbidden") return 403;
  }
  return 400;
}

type RouteContext = {
  params: Promise<{ couponId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    // GET and PATCH:
await requireAdmin("coupon.manage");
    const { couponId } = await context.params;
    const result = await getCouponDetail(couponId);
    return ok("Coupon fetched successfully", result, 200);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to fetch coupon",
      getStatusCode(error)
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    // GET and PATCH:
await requireAdmin("coupon.manage");
    const { couponId } = await context.params;
    const body = await request.json();

    // Check if this is a toggle request
    const toggleParsed = toggleCouponSchema.safeParse(body);
    if (toggleParsed.success && Object.keys(body).length === 1) {
      const result = await toggleCoupon(
        couponId,
        toggleParsed.data.isActive
      );
      return ok(
        `Coupon ${toggleParsed.data.isActive ? "enabled" : "disabled"} successfully`,
        result,
        200
      );
    }

    // Otherwise it's a full update
    const parsed = updateCouponSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const result = await updateCoupon(couponId, parsed.data);
    return ok("Coupon updated successfully", result, 200);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to update coupon",
      getStatusCode(error)
    );
  }
}