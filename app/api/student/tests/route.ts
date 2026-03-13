import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireAuth } from "@/server/auth/guards";
import { testService } from "@/server/services/test.service";
import { listStudentTestsQuerySchema } from "@/server/validations/test.schema";

function buildErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        message: "Validation failed.",
        errors: error.flatten(),
      },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    const lowerMessage = error.message.toLowerCase();

    if (lowerMessage.includes("unauthorized")) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 401 }
      );
    }

    if (lowerMessage.includes("forbidden") || lowerMessage.includes("access")) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      message: "Internal server error.",
    },
    { status: 500 }
  );
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const rawQuery = Object.fromEntries(request.nextUrl.searchParams.entries());
    const validatedQuery = listStudentTestsQuerySchema.parse(rawQuery);

    const data = await testService.listStudentTests(validatedQuery);

    return NextResponse.json(
      {
        success: true,
        message: "Student tests fetched successfully.",
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    return buildErrorResponse(error);
  }
}