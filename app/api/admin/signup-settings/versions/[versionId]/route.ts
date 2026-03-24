import { ok, fail } from "@/server/utils/api-response";
import { requireAuth } from "@/server/auth/guards";
import { updateSignupSettingsDraft } from "@/server/services/admin-signup-settings.service";
import { updateSignupSettingsDraftSchema } from "@/server/validations/admin-signup-settings.schema";
import { AppError } from "@/server/utils/errors";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ versionId: string }> }
) {
  try {
    const body = await request.json();
    const parsed = updateSignupSettingsDraftSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const { versionId } = await context.params;
    const session = await requireAuth();

    const data = await updateSignupSettingsDraft(session, versionId, parsed.data);

    return ok("Signup settings draft updated successfully", data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update signup settings draft";
    const statusCode = error instanceof AppError ? error.statusCode : 500;

    return fail(message, statusCode);
  }
}
