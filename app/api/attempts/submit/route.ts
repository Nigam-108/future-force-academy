import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guards";
import { fail, ok } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { submitAttemptSchema } from "@/server/validations/attempt.schema";
import { submitAttempt } from "@/server/services/attempt.service";

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
      return fail("Only students can submit attempts", 403);
    }

    const body = await request.json();
    const parsed = submitAttemptSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const result = await submitAttempt(parsed.data, session.userId);

    return ok("Attempt submitted successfully", result, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit attempt";
    return fail(message, getStatusCode(error));
  }
}