import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const protectedStudentRoutes = ["/student"];
const protectedAdminRoutes = ["/admin"];
const guestOnlyRoutes = ["/login", "/signup", "/forgot-password", "/signup/success"];

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

function getDefaultRedirectPath(role: "STUDENT" | "ADMIN" | "SUB_ADMIN") {
  if (role === "ADMIN" || role === "SUB_ADMIN") {
    return "/admin/dashboard";
  }

  return "/student/dashboard";
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isStudentProtected = protectedStudentRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminProtected = protectedAdminRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isGuestOnly = guestOnlyRoutes.includes(pathname);

  const session = await readSession(request);

  if (isGuestOnly && session) {
    return NextResponse.redirect(
      new URL(getDefaultRedirectPath(session.role), request.url)
    );
  }

  if (!isStudentProtected && !isAdminProtected) {
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    const redirectTo = `${pathname}${search || ""}`;
    loginUrl.searchParams.set("redirectTo", redirectTo);

    return NextResponse.redirect(loginUrl);
  }

  if (isAdminProtected && session.role !== "ADMIN" && session.role !== "SUB_ADMIN") {
    return NextResponse.redirect(new URL("/access-denied", request.url));
  }

  if (isStudentProtected && session.role !== "STUDENT") {
    return NextResponse.redirect(new URL(getDefaultRedirectPath(session.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/student/:path*",
    "/admin/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/signup/success",
  ],
};