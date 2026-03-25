import { NextRequest } from "next/server";
import { loginSchema } from "@/server/validations/auth.schema";
import { fail, ok } from "@/server/utils/api-response";
import { loginUser } from "@/server/services/auth.service";
import { setSessionCookie } from "@/server/auth/cookies";
import { AppError } from "@/server/utils/errors";
import {
  AUTH_EVENTS,
  logAuthEvent,
} from "@/server/services/auth-analytics.service";

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();

    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const { user, token } = await loginUser(parsed.data);

    await setSessionCookie(token);

    await logAuthEvent({
      eventType: AUTH_EVENTS.LOGIN_SUCCESS,
      email: user.email,
      userId: user.id,
      ipAddress: request.headers.get("x-forwarded-for") ?? null,
      userAgent: request.headers.get("user-agent") ?? null,
    });

    return ok("Login successful", user, 200);
  } catch (error) {
    await logAuthEvent({
      eventType: AUTH_EVENTS.LOGIN_FAILED,
      email:
        typeof body === "object" &&
        body !== null &&
        "identifier" in body &&
        typeof (body as { identifier?: unknown }).identifier === "string"
          ? (body as { identifier: string }).identifier
          : null,
      ipAddress: request.headers.get("x-forwarded-for") ?? null,
      userAgent: request.headers.get("user-agent") ?? null,
    });

    const message = error instanceof Error ? error.message : "Login failed";
    const statusCode = error instanceof AppError ? error.statusCode : 400;
    return fail(message, statusCode);
  }
}