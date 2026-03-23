import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { ok, fail } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import {
  assignStudentToBatches,
  getStudentBatchAssignments,
} from "@/server/services/batch.service";
import { assignStudentToBatchSchema } from "@/server/validations/batch.schema";

function getStatusCode(error: unknown) {
  if (error instanceof AppError) {
    return error.statusCode;
  }

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
 * GET: current student batch memberships
 * POST: replace memberships with selected batch IDs
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin("student.manage");
    const { id } = await context.params;
    const result = await getStudentBatchAssignments(id);
    return ok("Student batch assignments fetched successfully", result, 200);
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Failed to fetch student batch assignments",
      getStatusCode(error)
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin("student.manage");

    const { id } = await context.params;
    const body = await request.json();
    const parsed = assignStudentToBatchSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const result = await assignStudentToBatches(id, parsed.data);

    return ok("Student batch assignments updated successfully", result, 200);
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Failed to update student batch assignments",
      getStatusCode(error)
    );
  }
}