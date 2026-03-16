import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { fail, ok } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import {
  getQuestionById,
  updateQuestion,
} from "@/server/services/question.service";
import { updateQuestionSchema } from "@/server/validations/question.schema";

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
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const question = await getQuestionById(id);

    return ok("Question fetched successfully", question, 200);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch question";

    return fail(message, getStatusCode(error));
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateQuestionSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const question = await updateQuestion(id, parsed.data);

    return ok("Question updated successfully", question, 200);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update question";

    return fail(message, getStatusCode(error));
  }
}