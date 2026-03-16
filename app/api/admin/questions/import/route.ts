import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { bulkImportQuestions } from "@/server/services/question-import.service";
import { fail, ok } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { bulkImportQuestionsSchema } from "@/server/validations/question-import.schema";

/**
 * Converts known app/service errors into proper HTTP status codes.
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

export async function POST(request: NextRequest) {
  try {
    /**
     * Ensure only admin users can bulk import questions.
     *
     * Important:
     * requireAdmin() returns the authenticated session payload,
     * and this payload uses `userId` instead of `id`.
     */
    const admin = await requireAdmin();

    const body = await request.json();
    const parsed = bulkImportQuestionsSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    /**
     * Pass the authenticated admin's userId as createdById.
     */
    const result = await bulkImportQuestions(parsed.data, admin.userId);

    return ok("Questions imported successfully", result, 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to import questions";

    return fail(message, getStatusCode(error));
  }
}