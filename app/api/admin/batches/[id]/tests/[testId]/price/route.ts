import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { ok, fail } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { updateTestPrice } from "@/server/services/pricing.service";
import { updateTestPriceSchema } from "@/server/validations/pricing.schema";

function getStatusCode(error: unknown) {
  if (error instanceof AppError) return error.statusCode;
  if (error instanceof Error) {
    if (error.message === "Unauthorized") return 401;
    if (error.message === "Forbidden") return 403;
  }
  return 400;
}

type RouteContext = {
  params: Promise<{ id: string; testId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin("batch.manage");
    const { id: batchId, testId } = await context.params;
    const body = await request.json();
    const parsed = updateTestPriceSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const result = await updateTestPrice(
      batchId,
      testId,
      parsed.data.price ?? null
    );
    return ok("Test price updated successfully", result, 200);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to update test price",
      getStatusCode(error)
    );
  }
}