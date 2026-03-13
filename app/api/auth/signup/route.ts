import { NextRequest } from "next/server";
import { signupSchema } from "@/server/validations/auth.schema";
import { fail, ok } from "@/server/utils/api-response";
import { signupUser } from "@/server/services/auth.service";
import { setSessionCookie } from "@/server/auth/cookies";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const { user, token } = await signupUser(parsed.data);
    await setSessionCookie(token);

    return ok("Signup successful", user, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signup failed";
    return fail(message, 400);
  }
}
