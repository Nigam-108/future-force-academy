import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { fail, ok } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { assignTestQuestionsSchema } from "@/server/validations/test-question.schema";
import {
  assignQuestionsToTest,
  getAssignedQuestionsForTest,
} from "@/server/services/test-question.service";

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
    await requireAdmin("test.manage");
    const { testId } = await context.params;

    const result = await getAssignedQuestionsForTest(testId);

    return ok("Assigned test questions fetched successfully", result, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch assigned test questions";
    return fail(message, getStatusCode(error));
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
    const message = error instanceof Error ? error.message : "Failed to assign questions to test";
    return fail(message, getStatusCode(error));
  }
}