import { ok, fail } from "@/server/utils/api-response";
import { requireAuth } from "@/server/auth/guards";
import { updatePolicyDraft } from "@/server/services/admin-policy.service";
import { updatePolicyDraftSchema } from "@/server/validations/admin-policy.schema";
import { AppError } from "@/server/utils/errors";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ versionId: string }> }
) {
  try {
    const body = await request.json();
    const parsed = updatePolicyDraftSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const { versionId } = await context.params;
    const session = await requireAuth();

    const data = await updatePolicyDraft(session, versionId, parsed.data);

    return ok("Policy draft updated successfully", data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update policy draft";
    const statusCode = error instanceof AppError ? error.statusCode : 500;

    return fail(message, statusCode);
  }
}