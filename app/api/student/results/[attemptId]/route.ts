import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guards";
import { fail, ok } from "@/server/utils/api-response";
import { getStudentResultById } from "@/server/services/student.service";

type RouteContext = {
  params: Promise<{ attemptId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAuth();

    if (session.role !== "STUDENT") {
      return fail("Only students can view results", 403);
    }

    const { attemptId } = await context.params;
    const data = await getStudentResultById(session.userId, attemptId);

    return ok("Student result fetched successfully", data, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch result";
    return fail(message, 400);
  }
}