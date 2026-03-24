import { NextRequest } from "next/server";
import { ok, fail } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { signupSecurityRequirementSchema } from "@/server/validations/signup-v2.schema";
import { getSignupSecurityRequirement } from "@/server/services/signup-security.service";
import { getRequestContext } from "@/server/utils/request-context";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupSecurityRequirementSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const requestContext = getRequestContext(request);

    const data = await getSignupSecurityRequirement({
      email: parsed.data.email,
      mobileNumber: parsed.data.mobileNumber,
      ipAddress: requestContext.ipAddress,
    });

    return ok("Signup security requirement fetched successfully", data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch signup security requirement";
    const statusCode = error instanceof AppError ? error.statusCode : 500;

    return fail(message, statusCode);
  }
}
