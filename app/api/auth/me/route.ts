import { fail, ok } from "@/server/utils/api-response";
import { requireAuth } from "@/server/auth/guards";
import { getCurrentUser } from "@/server/services/auth.service";

export async function GET() {
  try {
    const session = await requireAuth();
    const user = await getCurrentUser(session.userId);
    return ok("Current user fetched", user);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return fail(message, 401);
  }
}
