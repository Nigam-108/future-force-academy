import { requireAdmin } from "@/server/auth/guards";
import { fail, ok } from "@/server/utils/api-response";
import { getAdminReports } from "@/server/services/student.service";

export async function GET() {
  try {
    await requireAdmin();

    const data = await getAdminReports();
    return ok("Admin reports fetched successfully", data, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch reports";
    return fail(message, 400);
  }
}