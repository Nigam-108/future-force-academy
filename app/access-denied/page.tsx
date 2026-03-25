import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">
          ⛔
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-red-600">
          Access denied
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">You do not have access to this page</h1>
        <p className="mt-3 text-sm text-slate-600 sm:text-base">
          This route is not available for your current account type.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Go to Login
          </Link>
          <Link
            href="/"
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}