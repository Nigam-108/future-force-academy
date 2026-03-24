import { PolicyType } from "@prisma/client";
import { ok, fail } from "@/server/utils/api-response";
import { requireAuth } from "@/server/auth/guards";
import { createPolicyDraft } from "@/server/services/admin-policy.service";
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

export async function POST(
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
    const data = await createPolicyDraft(session, type);

    return ok("Policy draft created successfully", data, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create policy draft";
    const statusCode = error instanceof AppError ? error.statusCode : 500;

    return fail(message, statusCode);
  }
}