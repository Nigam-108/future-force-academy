import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { ok, fail } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import {
  getPaymentById,
  updatePaymentStatus,
} from "@/server/services/payment.service";
import { updatePaymentStatusSchema } from "@/server/validations/payment.schema";

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

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin("payment.manage");
    const { paymentId } = await context.params;
    const result = await getPaymentById(paymentId);
    return ok("Payment fetched successfully", result, 200);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to fetch payment",
      getStatusCode(error)
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin("payment.manage");
    const { paymentId } = await context.params;
    const body = await request.json();
    const parsed = updatePaymentStatusSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const result = await updatePaymentStatus(paymentId, parsed.data);
    return ok("Payment status updated successfully", result, 200);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to update payment",
      getStatusCode(error)
    );
  }
}