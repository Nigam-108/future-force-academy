import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md rounded-3xl border bg-white p-10 text-center shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Access denied</h1>
        <p className="mt-3 text-sm text-slate-600">You do not have permission to access this page.</p>
        <Link href="/" className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
          Back to Home
        </Link>
      </div>
    </div>
  );
}