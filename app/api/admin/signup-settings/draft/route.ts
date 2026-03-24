import { ok, fail } from "@/server/utils/api-response";
import { requireAuth } from "@/server/auth/guards";
import { createSignupSettingsDraft } from "@/server/services/admin-signup-settings.service";
import { AppError } from "@/server/utils/errors";

export async function POST() {
  try {
    const session = await requireAuth();
    const data = await createSignupSettingsDraft(session);

    return ok("Signup settings draft created successfully", data, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create signup settings draft";
    const statusCode = error instanceof AppError ? error.statusCode : 500;

    return fail(message, statusCode);
  }
}
