import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { ok, fail } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import {
  getPaymentStats,
  listPayments,
} from "@/server/services/payment.service";
import { listPaymentsQuerySchema } from "@/server/validations/payment.schema";

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

    const query = Object.fromEntries(request.nextUrl.searchParams.entries());

    // Special case: return stats only
    if (query.statsOnly === "true") {
      const stats = await getPaymentStats();
      return ok("Payment stats fetched successfully", stats, 200);
    }

    const parsed = listPaymentsQuerySchema.safeParse(query);

    if (!parsed.success) {
      return fail("Invalid query parameters", 422, parsed.error.flatten());
    }

    const result = await listPayments(parsed.data);
    return ok("Payments fetched successfully", result, 200);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to fetch payments",
      getStatusCode(error)
    );
  }
}