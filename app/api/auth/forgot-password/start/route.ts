import { NextRequest } from "next/server";
import { ok, fail } from "@/server/utils/api-response";
import { forgotPasswordStartSchema } from "@/server/validations/password-reset.schema";
import { startPasswordReset } from "@/server/services/password-reset.service";
import { AppError } from "@/server/utils/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordStartSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const data = await startPasswordReset(parsed.data);

    return ok("Reset OTP sent successfully", data, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start password reset";
    const statusCode = error instanceof AppError ? error.statusCode : 500;

    return fail(message, statusCode);
  }
}