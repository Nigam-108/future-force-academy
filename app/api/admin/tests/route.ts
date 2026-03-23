import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { fail, ok } from "@/server/utils/api-response";
import {
  createTestSchema,
  listTestsQuerySchema,
} from "@/server/validations/test.schema";
import { createTest, listTests } from "@/server/services/test.service";
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
    await requireAdmin("test.manage");

    const query = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = listTestsQuerySchema.safeParse(query);

    if (!parsed.success) {
      return fail("Invalid query parameters", 422, parsed.error.flatten());
    }

    const result = await listTests(parsed.data);

    return ok("Tests fetched successfully", result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch tests";
    return fail(message, getStatusCode(error));
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin("test.manage");
    const body = await request.json();

    const parsed = createTestSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const test = await createTest(parsed.data, session.userId);

    return ok("Test created successfully", test, 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create test";
    return fail(message, getStatusCode(error));
  }
}