import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";

export const dynamic = "force-dynamic";

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

type AccessSummary = {
  totalAccessibleBatches: number;
  batches: Array<{
    batchId: string;
    batchTitle: string;
    examType: string;
    accessPath: "ADMIN_ASSIGNED" | "PURCHASED" | "BOTH";
    linkedTests: Array<{ id: string; title: string }>;
  }>;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function accessPathLabel(path: string) {
  switch (path) {
    case "PURCHASED":
      return "Purchased";
    case "ADMIN_ASSIGNED":
      return "Admin Enrolled";
    case "BOTH":
      return "Purchased + Enrolled";
    default:
      return path;
  }
}

export default async function StudentDashboardPage() {
  const [dashResult, accessResult] = await Promise.all([
    fetchInternalApi<StudentDashboardResponse>("/api/student/dashboard"),
    fetchInternalApi<AccessSummary>("/api/student/access"),
  ]);

  if (!dashResult.success || !dashResult.data) {
    return (
      <PageShell
        title="Dashboard"
        description="Track your enrolled tests, upcoming tests, and results."
      >
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Unable to load dashboard
          </h2>
          <p className="mt-2 text-sm text-slate-600">{dashResult.message}</p>
        </div>
      </PageShell>
    );
  }

  const { student, stats } = dashResult.data;
  const access = accessResult.data;

  return (
    <PageShell
      title="Dashboard"
      description="Track your enrolled tests, upcoming tests, and results."
    >
      {/* ── Welcome banner ── */}
      <div className="mb-8 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 p-8 text-white shadow-sm">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-200">
            Future Force Academy
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            Welcome back, {student.fullName}
          </h2>
          <p className="mt-3 text-sm text-slate-300">
            Continue your exam journey with structured tests, result tracking,
            and performance analysis.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/student/tests"
              className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Go to Tests
            </Link>
            <Link
              href="/student/purchases"
              className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              My Enrollments
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

      {/* ── Stats grid ── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Total Attempts</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {stats.totalAttempts}
          </p>
        </div>
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">In Progress</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {stats.inProgressAttempts}
          </p>
        </div>
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Submitted</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">
            {stats.submittedAttempts}
          </p>
        </div>
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Active Enrollments</p>
          <p className="mt-2 text-3xl font-bold text-blue-700">
            {access?.totalAccessibleBatches ?? 0}
          </p>
        </div>
      </div>

      {/* ── Active batch enrollments ── */}
      {access && access.batches.length > 0 ? (
        <div className="mt-8 rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Your Batch Enrollments
            </h2>
            <Link
              href="/student/purchases"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              View all →
            </Link>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {access.batches.map((batch) => (
              <div
                key={batch.batchId}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">
                      {batch.batchTitle}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {batch.examType} ·{" "}
                      {batch.linkedTests.length} test
                      {batch.linkedTests.length !== 1 ? "s" : ""} available
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    {accessPathLabel(batch.accessPath)}
                  </span>
                </div>
                <Link
                  href="/student/tests"
                  className="mt-3 block rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  View Tests
                </Link>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-dashed bg-white p-6 text-center shadow-sm">
          <p className="font-semibold text-slate-900">No active enrollments</p>
          <p className="mt-1 text-sm text-slate-500">
            Contact your admin to get enrolled in a batch and access tests.
          </p>
        </div>
      )}

      {/* ── Recent attempts ── */}
      <div className="mt-8 rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Attempts
          </h2>
          <Link
            href="/student/results"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            View all results →
          </Link>
        </div>

        <div className="mt-4 space-y-4">
          {stats.recentAttempts.length === 0 ? (
            <p className="text-sm text-slate-600">
              No attempts yet. Start a test to see your progress here.
            </p>
          ) : (
            stats.recentAttempts.map((attempt) => (
              <div key={attempt.id} className="rounded-2xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {attempt.test.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Status:{" "}
                      <span
                        className={
                          attempt.status === "SUBMITTED"
                            ? "text-emerald-700 font-medium"
                            : attempt.status === "IN_PROGRESS"
                            ? "text-amber-600 font-medium"
                            : "text-slate-600"
                        }
                      >
                        {attempt.status}
                      </span>{" "}
                      · Mode: {attempt.test.mode}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">
                      {formatDateTime(attempt.createdAt)}
                    </span>
                    {attempt.status === "SUBMITTED" ? (
                      <Link
                        href={`/student/results`}
                        className="rounded-xl border px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        View Result
                      </Link>
                    ) : attempt.status === "IN_PROGRESS" ? (
                      <Link
                        href={`/student/tests/${attempt.test.id}/instructions`}
                        className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
                      >
                        Resume
                      </Link>
                    ) : null}
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