import { ok, fail } from "@/server/utils/api-response";
import { requireAuth } from "@/server/auth/guards";
import { restorePolicyVersionAsNewPublishedCopy } from "@/server/services/admin-policy.service";
import { AppError } from "@/server/utils/errors";

export async function POST(
  _request: Request,
  context: { params: Promise<{ versionId: string }> }
) {
  try {
    const { versionId } = await context.params;
    const session = await requireAuth();

    const data = await restorePolicyVersionAsNewPublishedCopy(session, versionId);

    return ok("Policy version restored as new published copy successfully", data, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to restore policy version";
    const statusCode = error instanceof AppError ? error.statusCode : 500;

    return fail(message, statusCode);
  }
}