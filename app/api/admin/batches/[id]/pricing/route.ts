import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { ok, fail } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import {
  getBatchPricing,
  updateBatchPricing,
} from "@/server/services/pricing.service";
import { updateBatchPricingSchema } from "@/server/validations/pricing.schema";

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
    await requireAdmin("batch.manage");
    const { id } = await context.params;
    const result = await getBatchPricing(id);
    return ok("Batch pricing fetched successfully", result, 200);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to fetch batch pricing",
      getStatusCode(error)
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin("batch.manage");
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateBatchPricingSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const result = await updateBatchPricing(id, parsed.data);
    return ok("Batch pricing updated successfully", result, 200);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to update batch pricing",
      getStatusCode(error)
    );
  }
}