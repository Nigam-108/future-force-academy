import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/forms/signup-form";
import { AuthPageAlert } from "@/components/auth/auth-page-alert";
import {
  getDefaultRedirectPath,
  getOptionalSession,
} from "@/server/auth/redirects";

export default async function SignupPage(props: {
  searchParams?: Promise<{
    continueEmail?: string;
    notice?: string;
  }>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const session = await getOptionalSession();

  if (session) {
    redirect(getDefaultRedirectPath(session.role));
  }

  const initialContinueEmail = searchParams.continueEmail?.trim() || "";
  const notice = searchParams.notice?.trim() || "";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
            Future Force Academy
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Student Signup
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            Create your student account with email OTP verification. No course selection is needed at
            signup right now.
          </p>
          <p className="mt-4 text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-blue-600 underline">
              Login
            </Link>
          </p>
        </div>

        {notice ? <div className="mb-6"><AuthPageAlert tone="warning" message={notice} /></div> : null}

        <SignupForm
          initialContinueEmail={initialContinueEmail}
          initialNotice={notice}
        />
      </div>
    </div>
  );
}