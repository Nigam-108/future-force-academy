import { NextRequest } from "next/server";
import { loginSchema } from "@/server/validations/auth.schema";
import { fail, ok } from "@/server/utils/api-response";
import { loginUser } from "@/server/services/auth.service";
import { setSessionCookie } from "@/server/auth/cookies";
import { AppError } from "@/server/utils/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const { user, token } = await loginUser(parsed.data);
    await setSessionCookie(token);

    return ok("Login successful", user, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    const statusCode = error instanceof AppError ? error.statusCode : 400;

    return fail(message, statusCode);
  }
}