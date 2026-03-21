import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { ok, fail } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { getPricingRevenueStats } from "@/server/services/pricing.service";

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
    await requireAdmin();
    const batchId =
      request.nextUrl.searchParams.get("batchId") ?? undefined;
    const result = await getPricingRevenueStats(batchId);
    return ok("Pricing stats fetched successfully", result, 200);
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Failed to fetch pricing stats",
      getStatusCode(error)
    );
  }
}