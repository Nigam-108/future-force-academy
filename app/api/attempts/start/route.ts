import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireAuth } from "@/server/auth/guards";
import { attemptService } from "@/server/services/attempt.service";
import { startAttemptSchema } from "@/server/validations/attempt.schema";

function extractUserIdFromAuthContext(authContext: unknown): string | null {
  if (!authContext || typeof authContext !== "object") {
    return null;
  }

  const record = authContext as Record<string, unknown>;
  const possibleUserId = record.userId ?? record.id ?? record.sub;

  return typeof possibleUserId === "string" && possibleUserId.trim()
    ? possibleUserId
    : null;
}

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

  if (error instanceof SyntaxError) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid JSON body.",
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

    if (lowerMessage.includes("not found")) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 404 }
      );
    }

    if (lowerMessage.includes("already been submitted")) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 409 }
      );
    }

    if (
      lowerMessage.includes("not available") ||
      lowerMessage.includes("closed") ||
      lowerMessage.includes("not started yet") ||
      lowerMessage.includes("window has ended") ||
      lowerMessage.includes("configured correctly")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 400 }
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

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireAuth();
    const userId = extractUserIdFromAuthContext(authContext);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Authenticated user id could not be resolved.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const validatedBody = startAttemptSchema.parse(body);

    const data = await attemptService.startAttempt(validatedBody, userId);

    return NextResponse.json(
      {
        success: true,
        message: data.resumed
          ? "Attempt resumed successfully."
          : "Attempt started successfully.",
        data,
      },
      { status: data.resumed ? 200 : 201 }
    );
  } catch (error) {
    return buildErrorResponse(error);
  }
}