import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { fail, ok } from "@/server/utils/api-response";
import { blockStudent } from "@/server/services/student.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin("student.manage");
    const { id } = await context.params;

    const data = await blockStudent(id);
    return ok("Student blocked successfully", data, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to block student";
    return fail(message, 400);
  }
}