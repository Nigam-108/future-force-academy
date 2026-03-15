import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guards";
import { fail, ok } from "@/server/utils/api-response";
import { getStudentProfile, updateStudentProfile } from "@/server/services/student.service";
import { updateStudentProfileSchema } from "@/server/validations/student-profile.schema";

export async function GET() {
  try {
    const session = await requireAuth();

    if (session.role !== "STUDENT") {
      return fail("Only students can view profile", 403);
    }

    const data = await getStudentProfile(session.userId);
    return ok("Student profile fetched successfully", data, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch profile";
    return fail(message, 400);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();

    if (session.role !== "STUDENT") {
      return fail("Only students can update profile", 403);
    }

    const body = await request.json();
    const parsed = updateStudentProfileSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const data = await updateStudentProfile(session.userId, parsed.data);
    return ok("Student profile updated successfully", data, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update profile";
    return fail(message, 400);
  }
}