import { getSessionCookie } from "@/server/auth/cookies";
import { verifySessionToken } from "@/server/auth/jwt";

type SessionRole = "STUDENT" | "ADMIN" | "SUB_ADMIN";

export async function getOptionalSession() {
  const token = await getSessionCookie();

  if (!token) {
    return null;
  }

  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export function getDefaultRedirectPath(role: SessionRole) {
  if (role === "ADMIN" || role === "SUB_ADMIN") {
    return "/admin/dashboard";
  }

  return "/student/dashboard";
}

export function sanitizeRedirectTo(value?: string | null) {
  if (!value) return undefined;

  const safe = value.trim();

  if (!safe.startsWith("/")) return undefined;
  if (safe.startsWith("//")) return undefined;
  if (safe.startsWith("/api")) return undefined;

  return safe;
}