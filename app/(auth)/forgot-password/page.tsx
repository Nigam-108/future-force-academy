import Link from "next/link";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";
import { AuthPageAlert } from "@/components/auth/auth-page-alert";
import {
  getDefaultRedirectPath,
  getOptionalSession,
} from "@/server/auth/redirects";

export default async function ForgotPasswordPage(props: {
  searchParams?: Promise<{
    email?: string;
    notice?: string;
  }>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const session = await getOptionalSession();

  if (session) {
    redirect(getDefaultRedirectPath(session.role));
  }

  const initialEmail = searchParams.email?.trim() || "";
  const notice = searchParams.notice?.trim() || "";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
            Future Force Academy
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Forgot Password
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Reset your password securely using an email OTP.
          </p>
          <p className="mt-4 text-sm text-slate-600">
            Remembered your password?{" "}
            <Link href="/login" className="font-medium text-blue-600 underline">
              Back to Login
            </Link>
          </p>
        </div>

        {notice ? <div className="mb-6"><AuthPageAlert tone="warning" message={notice} /></div> : null}

        <ForgotPasswordForm
          initialEmail={initialEmail}
          initialNotice={notice}
        />
      </div>
    </div>
  );
}