import { ok, fail } from "@/server/utils/api-response";
import { requireAuth } from "@/server/auth/guards";
import { listAdminPolicies } from "@/server/services/admin-policy.service";
import { AppError } from "@/server/utils/errors";

export async function GET() {
  try {
    const session = await requireAuth();
    const data = await listAdminPolicies(session);

    return ok("Admin policies fetched successfully", data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch admin policies";
    const statusCode = error instanceof AppError ? error.statusCode : 500;

    return fail(message, statusCode);
  }
}