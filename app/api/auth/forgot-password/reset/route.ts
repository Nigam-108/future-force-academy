import { NextRequest } from "next/server";
import { ok, fail } from "@/server/utils/api-response";
import { forgotPasswordResetSchema } from "@/server/validations/password-reset.schema";
import { resetPasswordWithOtp } from "@/server/services/password-reset.service";
import { AppError } from "@/server/utils/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordResetSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const data = await resetPasswordWithOtp({
      email: parsed.data.email,
      otp: parsed.data.otp,
      newPassword: parsed.data.newPassword,
    });

    return ok("Password reset successful", data, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reset password";
    const statusCode = error instanceof AppError ? error.statusCode : 500;

    return fail(message, statusCode);
  }
}