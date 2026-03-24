import { ok, fail } from "@/server/utils/api-response";
import { requireAuth } from "@/server/auth/guards";
import { listAdminSignupSettings } from "@/server/services/admin-signup-settings.service";
import { AppError } from "@/server/utils/errors";

export async function GET() {
  try {
    const session = await requireAuth();
    const data = await listAdminSignupSettings(session);

    return ok("Signup settings fetched successfully", data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch signup settings";
    const statusCode = error instanceof AppError ? error.statusCode : 500;

    return fail(message, statusCode);
  }
}
