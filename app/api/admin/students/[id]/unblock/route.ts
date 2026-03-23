import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { fail, ok } from "@/server/utils/api-response";
import { unblockStudent } from "@/server/services/student.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin("student.manage");
    const { id } = await context.params;

    const data = await unblockStudent(id);
    return ok("Student unblocked successfully", data, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to unblock student";
    return fail(message, 400);
  }
}