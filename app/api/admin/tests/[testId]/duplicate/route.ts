import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { fail, ok } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { duplicateTest } from "@/server/services/test.service";

/**
 * Converts known app/service errors into HTTP codes.
 */
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
  params: Promise<{ testId: string }>;
};

/**
 * Duplicates an existing test into a fresh DRAFT copy.
 */
export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin();
    const { testId } = await context.params;

    const duplicated = await duplicateTest(testId, admin.userId);

    return ok("Test duplicated successfully", duplicated, 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to duplicate test";

    return fail(message, getStatusCode(error));
  }
}