import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { ok, fail } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { manuallyEnrollStudent } from "@/server/services/payment.service";
import { manualEnrollSchema } from "@/server/validations/payment.schema";

function getStatusCode(error: unknown) {
  if (error instanceof AppError) return error.statusCode;
  if (error instanceof Error) {
    if (error.message === "Unauthorized") return 401;
    if (error.message === "Forbidden") return 403;
  }
  return 400;
}

/**
 * POST /api/admin/purchases
 * Manual enrollment — admin grants a student batch access directly.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin("payment.manage");
    const body = await request.json();
    const parsed = manualEnrollSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const result = await manuallyEnrollStudent(parsed.data);
    return ok(result.message, result, 201);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to enroll student",
      getStatusCode(error)
    );
  }
}