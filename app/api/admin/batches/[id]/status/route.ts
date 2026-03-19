import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { ok, fail } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { updateBatchStatus } from "@/server/services/batch.service";
import { updateBatchStatusSchema } from "@/server/validations/batch.schema";

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

/**
 * PATCH /api/admin/batches/[id]/status
 *
 * Changes only the lifecycle status of a batch.
 * Body: { status: "DRAFT" | "ACTIVE" | "CLOSED" }
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateBatchStatusSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const result = await updateBatchStatus(id, parsed.data);

    return ok(
      `Batch status updated to ${parsed.data.status} successfully`,
      result,
      200
    );
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to update batch status",
      getStatusCode(error)
    );
  }
}