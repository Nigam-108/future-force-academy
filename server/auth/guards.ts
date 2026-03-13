import { getSessionCookie } from "@/server/auth/cookies";
import { verifySessionToken } from "@/server/auth/jwt";
import { AppError } from "@/server/utils/errors";

export async function requireAuth() {
  const token = await getSessionCookie();

  if (!token) {
    throw new AppError("Unauthorized", 401);
  }

  return verifySessionToken(token);
}

export async function requireAdmin() {
  const session = await requireAuth();

  if (session.role !== "ADMIN" && session.role !== "SUB_ADMIN") {
    throw new AppError("Forbidden", 403);
  }

  return session;
}
