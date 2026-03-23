import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { fail, ok } from "@/server/utils/api-response";
import {
  createQuestionSchema,
  listQuestionsQuerySchema,
} from "@/server/validations/question.schema";
import {
  createQuestion,
  listQuestions,
} from "@/server/services/question.service";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin("question.manage");

    const query = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = listQuestionsQuerySchema.safeParse(query);

    if (!parsed.success) {
      return fail("Invalid query parameters", 422, parsed.error.flatten());
    }

    const result = await listQuestions(parsed.data);

    return ok("Questions fetched successfully", result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch questions";
    const statusCode = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return fail(message, statusCode);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin("question.manage");
    const body = await request.json();

    const parsed = createQuestionSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const question = await createQuestion(parsed.data, session.userId);

    return ok("Question created successfully", question, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create question";
    const statusCode = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return fail(message, statusCode);
  }
}
