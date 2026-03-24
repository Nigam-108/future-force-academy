import { NextRequest } from "next/server";
import { ok, fail } from "@/server/utils/api-response";
import { getSignupPublicConfig } from "@/server/services/signup-v2.service";
import { AppError } from "@/server/utils/errors";

export async function GET(_request: NextRequest) {
  try {
    const data = await getSignupPublicConfig();
    return ok("Signup config fetched successfully", data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch signup config";
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    return fail(message, statusCode);
  }
}