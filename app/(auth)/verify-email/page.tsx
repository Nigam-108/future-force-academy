import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";

export default function VerifyEmailPage() {
  return (
    <PageShell title="Verify Your Email" description="Check your inbox and complete verification to activate your account.">
      <div className="mx-auto max-w-xl rounded-3xl border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 h-14 w-14 rounded-2xl bg-blue-100" />
        <h2 className="text-2xl font-semibold text-slate-900">Verification Email Sent</h2>
        <p className="mt-3 text-slate-600">
          We have sent a verification link to your email. Please verify your email address before logging in fully.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            Resend Email
          </button>
          <Link href="/login" className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Back to Login
          </Link>
        </div>
      </div>
    </PageShell>
  );
}