import { NextRequest } from "next/server";
import { ok, fail } from "@/server/utils/api-response";
import { continueVerificationSchema } from "@/server/validations/signup-v2.schema";
import { continuePendingSignup } from "@/server/services/signup-v2.service";
import { AppError } from "@/server/utils/errors";
import { getRequestContext } from "@/server/utils/request-context";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = continueVerificationSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const data = await continuePendingSignup(parsed.data, getRequestContext(request));
    return ok("Pending verification loaded successfully", data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to continue verification";
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    return fail(message, statusCode);
  }
}