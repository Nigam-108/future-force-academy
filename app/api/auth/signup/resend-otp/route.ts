import { NextRequest } from "next/server";
import { ok, fail } from "@/server/utils/api-response";
import { resendOtpSchema } from "@/server/validations/signup-v2.schema";
import { resendSignupOtp } from "@/server/services/signup-v2.service";
import { AppError } from "@/server/utils/errors";
import { getRequestContext } from "@/server/utils/request-context";
import {
  AUTH_EVENTS,
  logAuthEvent,
} from "@/server/services/auth-analytics.service";

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();

    const parsed = resendOtpSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const data = await resendSignupOtp(parsed.data, getRequestContext(request));

    await logAuthEvent({
      eventType: AUTH_EVENTS.OTP_RESENT,
      email:
        typeof body === "object" &&
        body !== null &&
        "email" in body &&
        typeof (body as { email?: unknown }).email === "string"
          ? (body as { email: string }).email
          : null,
      ipAddress: request.headers.get("x-forwarded-for") ?? null,
      userAgent: request.headers.get("user-agent") ?? null,
    });

    return ok("OTP resent successfully", data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to resend OTP";
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    return fail(message, statusCode);
  }
}