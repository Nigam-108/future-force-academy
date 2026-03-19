import { requireAuth } from "@/server/auth/guards";
import { ok, fail } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { getStudentPurchases } from "@/server/services/payment.service";

function getStatusCode(error: unknown) {
  if (error instanceof AppError) return error.statusCode;
  if (error instanceof Error) {
    if (error.message === "Unauthorized") return 401;
    if (error.message === "Forbidden") return 403;
  }
  return 400;
}

export async function GET() {
  try {
    const session = await requireAuth();

    if (session.role !== "STUDENT") {
      return fail("Only students can view their purchases", 403);
    }

    const purchases = await getStudentPurchases(session.userId);
    return ok("Student purchases fetched successfully", purchases, 200);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to fetch purchases",
      getStatusCode(error)
    );
  }
}