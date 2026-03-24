import { NextRequest } from "next/server";
import { ok, fail } from "@/server/utils/api-response";
import { verifySignupOtpSchema } from "@/server/validations/signup-v2.schema";
import { verifySignupOtp } from "@/server/services/signup-v2.service";
import { AppError } from "@/server/utils/errors";
import { getRequestContext } from "@/server/utils/request-context";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifySignupOtpSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const data = await verifySignupOtp(parsed.data, getRequestContext(request));
    return ok("Signup verified successfully", data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to verify signup OTP";
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    return fail(message, statusCode);
  }
}