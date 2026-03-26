import { NextRequest } from "next/server";

import { requireAdmin } from "@/server/auth/guards";
import { fail, ok } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import {
  deleteTest,
  getTestById,
  updateTest,
} from "@/server/services/test.service";
import { updateTestSchema } from "@/server/validations/test.schema";

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
    const test = await getTestById(testId);

    return ok("Test fetched successfully", test, 200);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch test";

    return fail(message, getStatusCode(error), getErrorDetails(error));
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin("test.manage");
    const { testId } = await context.params;
    const body = await request.json();
    const parsed = updateTestSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const test = await updateTest(testId, parsed.data);

    return ok("Test updated successfully", test, 200);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update test";

    return fail(message, getStatusCode(error), getErrorDetails(error));
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin("test.manage");
    const { testId } = await context.params;
    const deleted = await deleteTest(testId);

    return ok("Test deleted successfully", deleted, 200);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete test";

    return fail(message, getStatusCode(error), getErrorDetails(error));
  }
}