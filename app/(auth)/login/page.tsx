import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/login-form";
import { AuthPageAlert } from "@/components/auth/auth-page-alert";
import {
  getDefaultRedirectPath,
  getOptionalSession,
  sanitizeRedirectTo,
} from "@/server/auth/redirects";

export default async function LoginPage(props: {
  searchParams?: Promise<{
    redirectTo?: string;
    email?: string;
    notice?: string;
    loggedOut?: string;
  }>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const session = await getOptionalSession();

  if (session) {
    redirect(getDefaultRedirectPath(session.role));
  }

  const redirectTo = sanitizeRedirectTo(searchParams.redirectTo);
  const initialIdentifier = searchParams.email?.trim() || "";

  let pageNotice = searchParams.notice?.trim() || "";

  if (!pageNotice && searchParams.loggedOut === "1") {
    pageNotice = "You have been logged out successfully.";
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
            Future Force Academy
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Login
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Access your student or admin account using email or mobile number.
          </p>
          <p className="mt-4 text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-blue-600 underline">
              Sign up
            </Link>
          </p>
          <p className="mt-2 text-sm text-slate-600">
            <Link href="/forgot-password" className="font-medium text-blue-600 underline">
              Forgot password?
            </Link>
          </p>
        </div>

        {pageNotice ? <AuthPageAlert tone="info" message={pageNotice} /> : null}

        <div className={pageNotice ? "mt-5" : ""}>
          <LoginForm
            redirectTo={redirectTo}
            initialIdentifier={initialIdentifier}
            initialNotice=""
          />
        </div>
      </div>
    </div>
  );
}