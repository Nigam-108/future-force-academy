import { NextRequest } from "next/server";
import { ok, fail } from "@/server/utils/api-response";
import { signupAvailabilitySchema } from "@/server/validations/signup-v2.schema";
import { checkSignupAvailability } from "@/server/services/signup-v2.service";
import { AppError } from "@/server/utils/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupAvailabilitySchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const data = await checkSignupAvailability(parsed.data);
    return ok("Signup availability checked successfully", data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to check signup availability";
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    return fail(message, statusCode);
  }
}