import { requireAuth } from "@/server/auth/guards";
import { fail, ok } from "@/server/utils/api-response";
import { getStudentResults } from "@/server/services/student.service";
import { getStudentTestRanks } from "@/server/services/rank.service";

export async function GET() {
  try {
    const session = await requireAuth();

    if (session.role !== "STUDENT") {
      return fail("Only students can view results", 403);
    }

    const results = await getStudentResults(session.userId);

    // Attach live rank data to each result
    const resultsWithRanks = await Promise.all(
      results.map(async (attempt) => {
        const ranks = await getStudentTestRanks(session.userId, attempt.testId);
        return { ...attempt, ranks };
      })
    );

    return ok("Student results fetched successfully", resultsWithRanks, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch results";
    return fail(message, 400);
  }
}