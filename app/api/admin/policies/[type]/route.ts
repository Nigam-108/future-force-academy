import { PolicyType } from "@prisma/client";
import { ok, fail } from "@/server/utils/api-response";
import { requireAuth } from "@/server/auth/guards";
import { getAdminPolicyDetail } from "@/server/services/admin-policy.service";
import { AppError } from "@/server/utils/errors";

function resolvePolicyType(typeParam: string): PolicyType | null {
  switch (typeParam) {
    case "terms":
      return PolicyType.TERMS;
    case "privacy":
      return PolicyType.PRIVACY;
    case "refund-cancellation":
      return PolicyType.REFUND_CANCELLATION;
    default:
      return null;
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ type: string }> }
) {
  try {
    const { type: rawType } = await context.params;
    const type = resolvePolicyType(rawType);

    if (!type) {
      return fail("Invalid policy type", 404);
    }

    const session = await requireAuth();
    const data = await getAdminPolicyDetail(session, type);

    return ok("Admin policy detail fetched successfully", data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch admin policy detail";
    const statusCode = error instanceof AppError ? error.statusCode : 500;

    return fail(message, statusCode);
  }
}