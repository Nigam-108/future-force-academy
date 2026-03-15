import { requireAuth } from "@/server/auth/guards";
import { fail, ok } from "@/server/utils/api-response";
import { getStudentDashboard } from "@/server/services/student.service";

export async function GET() {
  try {
    const session = await requireAuth();

    if (session.role !== "STUDENT") {
      return fail("Only students can view dashboard", 403);
    }

    const data = await getStudentDashboard(session.userId);
    return ok("Student dashboard fetched successfully", data, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch dashboard";
    return fail(message, 400);
  }
}