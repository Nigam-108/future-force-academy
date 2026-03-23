import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { ok, fail } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import {
  assignBatchesToTest,
  getTestBatchAssignments,
} from "@/server/services/test-batch.service";
import { assignBatchesToTestSchema } from "@/server/validations/test-batch.schema";

function getStatusCode(error: unknown) {
  if (error instanceof AppError) return error.statusCode;
  if (error instanceof Error) {
    if (error.message === "Unauthorized") return 401;
    if (error.message === "Forbidden") return 403;
  }
  return 400;
}

type RouteContext = {
  params: Promise<{ testId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    // GET and POST:
    await requireAdmin("test.manage");
    const { testId } = await context.params;
    const result = await getTestBatchAssignments(testId);
    return ok("Test batch assignments fetched successfully", result, 200);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to fetch test batch assignments",
      getStatusCode(error)
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    // GET and POST:
    await requireAdmin("test.manage");
    const { testId } = await context.params;
    const body = await request.json();
    const parsed = assignBatchesToTestSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const result = await assignBatchesToTest(testId, parsed.data);
    return ok("Test batch assignments updated successfully", result, 200);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to update test batch assignments",
      getStatusCode(error)
    );
  }
}