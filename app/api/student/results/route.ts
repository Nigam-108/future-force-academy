import { requireAuth } from "@/server/auth/guards";
import { fail, ok } from "@/server/utils/api-response";
import { getStudentResults } from "@/server/services/student.service";

export async function GET() {
  try {
    const session = await requireAuth();

    if (session.role !== "STUDENT") {
      return fail("Only students can view results", 403);
    }

    const data = await getStudentResults(session.userId);
    return ok("Student results fetched successfully", data, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch results";
    return fail(message, 400);
  }
}