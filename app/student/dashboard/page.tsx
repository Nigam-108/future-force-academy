import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";

type BatchMembership = {
  id: string;
  assignedAt: string;
  batch: {
    id: string;
    title: string;
    slug: string;
    examType: string;
    status: string;
    isPaid: boolean;
  };
};

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
  batchMemberships: BatchMembership[];
};

function examTypeBadgeClass(examType: string) {
  switch (examType) {
    case "WPSI":
      return "bg-blue-50 text-blue-700";
    case "GPSC":
      return "bg-violet-50 text-violet-700";
    case "UPSC":
      return "bg-indigo-50 text-indigo-700";
    case "TECHNICAL_OPERATOR":
      return "bg-sky-50 text-sky-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default async function StudentDashboardPage() {
  const result =
    await fetchInternalApi<StudentDashboardResponse>("/api/student/dashboard");

  if (!result.success || !result.data) {
    return (
      <PageShell
        title="Dashboard"
        description="Track your enrolled tests, upcoming tests, and results."
      >
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Unable to load dashboard
          </h2>
          <p className="mt-2 text-sm text-slate-600">{result.message}</p>
        </div>
      </PageShell>
    );
  }

  const { student, stats, batchMemberships } = result.data;

  return (
    <PageShell
      title="Dashboard"
      description="Track your enrolled tests, upcoming tests, and results."
    >
      {/* Hero banner */}
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
            and profile management.
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

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Total Attempts</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {stats.totalAttempts}
          </p>
        </div>
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">In Progress</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {stats.inProgressAttempts}
          </p>
        </div>
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Submitted</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {stats.submittedAttempts}
          </p>
        </div>
      </div>

      {/* Enrolled batches */}
      <div className="mt-8 rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Enrolled Batches
          </h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {batchMemberships.length} enrolled
          </span>
        </div>

        {batchMemberships.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed p-6 text-center">
            <p className="text-sm text-slate-500">
              You are not enrolled in any batch yet.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Contact your admin to get enrolled in the relevant exam batch.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {batchMemberships.map((membership) => (
              <div
                key={membership.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">
                    {membership.batch.title}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${examTypeBadgeClass(
                      membership.batch.examType
                    )}`}
                  >
                    {membership.batch.examType}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span
                    className={`rounded-full px-2 py-1 font-medium ${
                      membership.batch.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700"
                        : membership.batch.status === "DRAFT"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {membership.batch.status}
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 font-medium ${
                      membership.batch.isPaid
                        ? "bg-blue-50 text-blue-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {membership.batch.isPaid ? "Paid" : "Free"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Enrolled{" "}
                  {new Intl.DateTimeFormat("en-IN", {
                    dateStyle: "medium",
                  }).format(new Date(membership.assignedAt))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent attempts */}
      <div className="mt-8 rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Recent Attempts
        </h2>
        <div className="mt-4 space-y-4">
          {stats.recentAttempts.length === 0 ? (
            <p className="text-sm text-slate-600">No attempts yet.</p>
          ) : (
            stats.recentAttempts.map((attempt) => (
              <div key={attempt.id} className="rounded-2xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {attempt.test.title}
                    </p>
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