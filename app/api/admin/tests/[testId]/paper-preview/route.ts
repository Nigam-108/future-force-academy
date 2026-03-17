import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { fail, ok } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { getTestPaperPreview } from "@/server/services/test-preview.service";

/**
 * Maps service/app errors into proper HTTP status codes.
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

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();

    const { testId } = await context.params;
    const data = await getTestPaperPreview(testId);

    return ok("Test paper preview fetched successfully", data, 200);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch test paper preview";

    return fail(message, getStatusCode(error));
  }
}