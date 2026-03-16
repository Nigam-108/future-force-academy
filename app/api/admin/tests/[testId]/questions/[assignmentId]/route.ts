import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { fail, ok } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import {
  removeAssignedQuestionFromTest,
  updateAssignedQuestionInTest,
} from "@/server/services/test-question.service";
import { updateAssignedTestQuestionSchema } from "@/server/validations/test-question.schema";

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
  params: Promise<{
    testId: string;
    assignmentId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();

    const { testId, assignmentId } = await context.params;
    const body = await request.json();
    const parsed = updateAssignedTestQuestionSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const result = await updateAssignedQuestionInTest(
      testId,
      assignmentId,
      parsed.data
    );

    return ok("Assigned question updated successfully", result, 200);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update assigned question";

    return fail(message, getStatusCode(error));
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();

    const { testId, assignmentId } = await context.params;
    const result = await removeAssignedQuestionFromTest(testId, assignmentId);

    return ok("Assigned question removed successfully", result, 200);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to remove assigned question";

    return fail(message, getStatusCode(error));
  }
}