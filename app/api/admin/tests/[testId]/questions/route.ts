import { NextRequest } from "next/server";

import { requireAdmin } from "@/server/auth/guards";
import { fail, ok } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import {
  assignQuestionsToTest,
  getAssignedQuestionsForTest,
  removeAllAssignedQuestionsFromTest,
  removeSelectedAssignedQuestionsFromTest,
} from "@/server/services/test-question.service";
import {
  assignTestQuestionsSchema,
  deleteAssignedQuestionsSchema,
} from "@/server/validations/test-question.schema";

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

function getErrorDetails(error: unknown) {
  if (error instanceof AppError) {
    return error.details ?? null;
  }

  return null;
}

type RouteContext = {
  params: Promise<{ testId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin("test.manage");
    const { testId } = await context.params;
    const result = await getAssignedQuestionsForTest(testId);

    return ok("Assigned test questions fetched successfully", result, 200);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch assigned test questions";

    return fail(message, getStatusCode(error), getErrorDetails(error));
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin("test.manage");
    const { testId } = await context.params;
    const body = await request.json();
    const parsed = assignTestQuestionsSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const result = await assignQuestionsToTest(testId, parsed.data);

    return ok("Questions assigned to test successfully", result, 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to assign questions to test";

    return fail(message, getStatusCode(error), getErrorDetails(error));
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin("test.manage");
    const { testId } = await context.params;
    const body = await request.json();
    const parsed = deleteAssignedQuestionsSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    if (parsed.data.mode === "all") {
      const result = await removeAllAssignedQuestionsFromTest(testId);

      return ok("All assigned questions removed successfully", result, 200);
    }

    const result = await removeSelectedAssignedQuestionsFromTest(
      testId,
      parsed.data
    );

    return ok("Selected assigned questions removed successfully", result, 200);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to remove assigned questions from test";

    return fail(message, getStatusCode(error), getErrorDetails(error));
  }
}