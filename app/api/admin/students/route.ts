import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { fail, ok } from "@/server/utils/api-response";
import { getAdminStudents } from "@/server/services/student.service";
import { listAdminStudentsQuerySchema } from "@/server/validations/admin-student.schema";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin("student.manage");

    const query = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = listAdminStudentsQuerySchema.safeParse(query);

    if (!parsed.success) {
      return fail("Invalid query parameters", 422, parsed.error.flatten());
    }

    const data = await getAdminStudents(parsed.data);
    return ok("Admin students fetched successfully", data, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch students";
    return fail(message, 400);
  }
}