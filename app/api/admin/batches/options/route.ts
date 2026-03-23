import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { ok, fail } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { getBatchOptions } from "@/server/services/batch.service";

function getStatusCode(error: unknown) {
  if (error instanceof AppError) {
    return error.statusCode;
  }

  if (error instanceof Error) {
    if (error.message === "Unauthorized") return 401;
    if (error.message === "Forbidden") return 403;
  }

  return 400;
}

/**
 * Lightweight route for student-to-batch assignment UI.
 */
export async function GET(_request: NextRequest) {
  try {
    await requireAdmin("batch.manage");
    const result = await getBatchOptions();
    return ok("Batch options fetched successfully", result, 200);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to fetch batch options",
      getStatusCode(error)
    );
  }
}