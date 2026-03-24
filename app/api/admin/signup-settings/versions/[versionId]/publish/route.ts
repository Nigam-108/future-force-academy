import { ok, fail } from "@/server/utils/api-response";
import { requireAuth } from "@/server/auth/guards";
import { publishSignupSettingsDraft } from "@/server/services/admin-signup-settings.service";
import { AppError } from "@/server/utils/errors";

export async function POST(
  _request: Request,
  context: { params: Promise<{ versionId: string }> }
) {
  try {
    const { versionId } = await context.params;
    const session = await requireAuth();

    const data = await publishSignupSettingsDraft(session, versionId);

    return ok("Signup settings draft published successfully", data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to publish signup settings draft";
    const statusCode = error instanceof AppError ? error.statusCode : 500;

    return fail(message, statusCode);
  }
}
