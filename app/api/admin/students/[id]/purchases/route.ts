import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { ok, fail } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { getStudentPurchaseHistory } from "@/server/services/payment.service";

function getStatusCode(error: unknown) {
  if (error instanceof AppError) return error.statusCode;
  if (error instanceof Error) {
    if (error.message === "Unauthorized") return 401;
    if (error.message === "Forbidden") return 403;
  }
  return 400;
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const result = await getStudentPurchaseHistory(id);
    return ok("Student purchase history fetched successfully", result, 200);
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Failed to fetch student purchase history",
      getStatusCode(error)
    );
  }
}