import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { ok, fail } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { createCoupon, listCoupons } from "@/server/services/coupon.service";
import {
  createCouponSchema,
  listCouponsQuerySchema,
} from "@/server/validations/coupon.schema";

function getStatusCode(error: unknown) {
  if (error instanceof AppError) return error.statusCode;
  if (error instanceof Error) {
    if (error.message === "Unauthorized") return 401;
    if (error.message === "Forbidden") return 403;
  }
  return 400;
}

export async function GET(request: NextRequest) {
  try {
    // GET and POST:
await requireAdmin("coupon.manage");

    const query = Object.fromEntries(
      request.nextUrl.searchParams.entries()
    );
    const parsed = listCouponsQuerySchema.safeParse(query);

    if (!parsed.success) {
      return fail("Invalid query parameters", 422, parsed.error.flatten());
    }

    const result = await listCoupons(parsed.data);
    return ok("Coupons fetched successfully", result, 200);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to fetch coupons",
      getStatusCode(error)
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // GET and POST:
await requireAdmin("coupon.manage");

    const body = await request.json();
    const parsed = createCouponSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const result = await createCoupon(parsed.data);
    return ok("Coupon created successfully", result, 201);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to create coupon",
      getStatusCode(error)
    );
  }
}