import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { ok, fail } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import {
  getAdminPurchaseById,
  cancelPurchase,
} from "@/server/services/payment.service";

function getStatusCode(error: unknown) {
  if (error instanceof AppError) return error.statusCode;
  if (error instanceof Error) {
    if (error.message === "Unauthorized") return 401;
    if (error.message === "Forbidden") return 403;
  }
  return 400;
}

type RouteContext = {
  params: Promise<{ purchaseId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { purchaseId } = await context.params;
    const result = await getAdminPurchaseById(purchaseId);
    return ok("Purchase fetched successfully", result, 200);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to fetch purchase",
      getStatusCode(error)
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { purchaseId } = await context.params;
    const result = await cancelPurchase(purchaseId);
    return ok("Purchase cancelled successfully", result, 200);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to cancel purchase",
      getStatusCode(error)
    );
  }
}