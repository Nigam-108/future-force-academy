import { ok, fail } from "@/server/utils/api-response";
import { requireAuth } from "@/server/auth/guards";
import { getPendingPolicyNotices } from "@/server/services/policy-notice.service";
import { AppError } from "@/server/utils/errors";

export async function GET() {
  try {
    const session = await requireAuth();
    const data = await getPendingPolicyNotices(session.userId);

    return ok("Policy notices fetched successfully", data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    const statusCode = error instanceof AppError ? error.statusCode : 401;

    return fail(message, statusCode);
  }
}