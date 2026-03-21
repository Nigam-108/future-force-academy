import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const protectedStudentRoutes = ["/student"];
const protectedAdminRoutes = ["/admin/dashboard", "/admin/questions", "/admin/tests", "/admin/students", "/admin/payments", "/admin/reports", "/admin/categories", "/admin/announcements", "/admin/support", "/admin/permissions", "/admin/activity-logs"];

const cookieName = process.env.COOKIE_NAME || "ffa_session";
const jwtSecret = process.env.JWT_SECRET || "replace-with-secret";
const secret = new TextEncoder().encode(jwtSecret);

async function readSession(request: NextRequest) {
  const token = request.cookies.get(cookieName)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as {
      userId: string;
      email: string;
      role: "STUDENT" | "ADMIN" | "SUB_ADMIN";
    };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isStudentProtected = protectedStudentRoutes.some((route) => pathname.startsWith(route));
  const isAdminProtected = protectedAdminRoutes.some((route) => pathname.startsWith(route));

  if (!isStudentProtected && !isAdminProtected) {
    return NextResponse.next();
  }

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const session = await readSession(request);

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminProtected && session.role !== "ADMIN" && session.role !== "SUB_ADMIN") {
    const deniedUrl = new URL("/access-denied", request.url);
    return NextResponse.redirect(deniedUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*", "/admin/:path*"],
};
