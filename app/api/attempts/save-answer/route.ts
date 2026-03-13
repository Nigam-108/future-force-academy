import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guards";
import { fail, ok } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { saveAnswerSchema } from "@/server/validations/attempt.schema";
import { saveAnswer } from "@/server/services/attempt.service";

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
    const session = await requireAuth();

    if (session.role !== "STUDENT") {
      return fail("Only students can save answers", 403);
    }

    const body = await request.json();
    const parsed = saveAnswerSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const result = await saveAnswer(parsed.data, session.userId);

    return ok("Answer saved successfully", result, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save answer";
    return fail(message, getStatusCode(error));
  }
}