import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guards";
import { fail, ok } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { getAttemptViewQuerySchema } from "@/server/validations/attempt.schema";
import { getAttemptView } from "@/server/services/attempt.service";

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

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    if (session.role !== "STUDENT") {
      return fail("Only students can view attempts", 403);
    }

    const query = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = getAttemptViewQuerySchema.safeParse(query);

    if (!parsed.success) {
      return fail("Invalid query parameters", 422, parsed.error.flatten());
    }

    const result = await getAttemptView(parsed.data, session.userId);

    return ok("Attempt view fetched successfully", result, 200);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch attempt view";

    return fail(message, getStatusCode(error));
  }
}