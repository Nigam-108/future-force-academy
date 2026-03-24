import { NextRequest } from "next/server";
import { ok, fail } from "@/server/utils/api-response";
import { signupStartSchema } from "@/server/validations/signup-v2.schema";
import { startSignup } from "@/server/services/signup-v2.service";
import { AppError } from "@/server/utils/errors";
import { getRequestContext } from "@/server/utils/request-context";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupStartSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const data = await startSignup(parsed.data, getRequestContext(request));
    return ok("Verification OTP sent successfully", data, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start signup";
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    return fail(message, statusCode);
  }
}