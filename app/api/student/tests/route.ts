import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guards";
import { fail, ok } from "@/server/utils/api-response";
import { listStudentTests } from "@/server/services/test.service";
import { listStudentTestsQuerySchema } from "@/server/validations/student-test.schema";
import { AppError } from "@/server/utils/errors";

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
      return fail("Only students can view tests", 403);
    }

    const query = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = listStudentTestsQuerySchema.safeParse(query);

    if (!parsed.success) {
      return fail("Invalid query parameters", 422, parsed.error.flatten());
    }

   const result = await listStudentTests(parsed.data, session.userId);

    return ok("Student tests fetched successfully", result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch student tests";
    return fail(message, getStatusCode(error));
  }
}
