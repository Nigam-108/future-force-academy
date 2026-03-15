import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";

type StudentDashboardResponse = {
  student: {
    id: string;
    fullName: string;
    email: string;
    mobileNumber: string | null;
    preferredLanguage: string;
    emailVerified: boolean;
    status: string;
  };
  stats: {
    totalAttempts: number;
    inProgressAttempts: number;
    submittedAttempts: number;
    recentAttempts: Array<{
      id: string;
      status: string;
      createdAt: string;
      test: {
        id: string;
        title: string;
        slug: string;
        mode: string;
        visibilityStatus: string;
        totalMarks: number;
      };
    }>;
  };
};

export default async function StudentDashboardPage() {
  const result = await fetchInternalApi<StudentDashboardResponse>("/api/student/dashboard");

  if (!result.success || !result.data) {
    return (
      <PageShell
        title="Dashboard"
        description="Track your enrolled tests, upcoming tests, and results."
      >
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Unable to load dashboard</h2>
          <p className="mt-2 text-sm text-slate-600">{result.message}</p>
        </div>
      </PageShell>
    );
  }

  const { student, stats } = result.data;

  return (
    <PageShell
      title="Dashboard"
      description="Track your enrolled tests, upcoming tests, and results."
    >
      <div className="mb-8 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 p-8 text-white shadow-sm">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-200">
            Future Force Academy
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            Welcome back, {student.fullName}
          </h2>
          <p className="mt-3 text-sm text-slate-300">
            Continue your exam journey with structured tests, result tracking, and profile management.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/student/tests"
              className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Go to Tests
            </Link>
            <Link
              href="/student/results"
              className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              View Results
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Total Attempts</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalAttempts}</p>
        </div>
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">In Progress</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.inProgressAttempts}</p>
        </div>
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Submitted</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.submittedAttempts}</p>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Recent Attempts</h2>
        <div className="mt-4 space-y-4">
          {stats.recentAttempts.length === 0 ? (
            <p className="text-sm text-slate-600">No attempts yet.</p>
          ) : (
            stats.recentAttempts.map((attempt) => (
              <div key={attempt.id} className="rounded-2xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{attempt.test.title}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Status: {attempt.status} • Mode: {attempt.test.mode}
                    </p>
                  </div>
                  <div className="text-sm text-slate-500">
                    {new Date(attempt.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PageShell>
  );
}