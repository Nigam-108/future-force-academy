import { clearSessionCookie } from "@/server/auth/cookies";
import { ok } from "@/server/utils/api-response";

export async function POST() {
  await clearSessionCookie();
  return ok("Logout successful");
}
