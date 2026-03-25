import { NextRequest } from "next/server";
import { ok, fail } from "@/server/utils/api-response";
import { verifySignupOtpSchema } from "@/server/validations/signup-v2.schema";
import { verifySignupOtp } from "@/server/services/signup-v2.service";
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

    const parsed = verifySignupOtpSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const data = await verifySignupOtp(parsed.data, getRequestContext(request));

    await logAuthEvent({
      eventType: AUTH_EVENTS.OTP_VERIFIED,
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

    await logAuthEvent({
      eventType: AUTH_EVENTS.SIGNUP_COMPLETED,
      email:
        typeof data === "object" &&
        data !== null &&
        "user" in data &&
        typeof (data as { user?: { email?: string } }).user?.email === "string"
          ? (data as { user: { email: string } }).user.email
          : typeof body === "object" &&
            body !== null &&
            "email" in body &&
            typeof (body as { email?: unknown }).email === "string"
          ? (body as { email: string }).email
          : null,
      userId:
        typeof data === "object" &&
        data !== null &&
        "user" in data &&
        typeof (data as { user?: { id?: string } }).user?.id === "string"
          ? (data as { user: { id: string } }).user.id
          : null,
      ipAddress: request.headers.get("x-forwarded-for") ?? null,
      userAgent: request.headers.get("user-agent") ?? null,
    });

    return ok("Signup verified successfully", data);
  } catch (error) {
    await logAuthEvent({
      eventType: AUTH_EVENTS.SIGNUP_FAILED,
      email:
        typeof body === "object" &&
        body !== null &&
        "email" in body &&
        typeof (body as { email?: unknown }).email === "string"
          ? (body as { email: string }).email
          : null,
      ipAddress: request.headers.get("x-forwarded-for") ?? null,
      userAgent: request.headers.get("user-agent") ?? null,
      metadata: {
        reason: "otp_verification_failed",
      },
    });

    const message = error instanceof Error ? error.message : "Failed to verify signup OTP";
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    return fail(message, statusCode);
  }
}