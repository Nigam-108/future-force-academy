import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";

type AdminReportsResponse = {
  counts: {
    totalStudents: number;
    activeStudents: number;
    blockedStudents: number;
    totalQuestions: number;
    totalTests: number;
    totalAttempts: number;
    submittedAttempts: number;
  };
  averages: {
    averageMarksObtained: number;
    averagePercentage: number;
  };
  recentAttempts: Array<{
    id: string;
    status: string;
    createdAt: string;
    user: {
      id: string;
      fullName: string;
      email: string;
    };
    test: {
      id: string;
      title: string;
      slug: string;
    };
  }>;
};

export default async function AdminReportsPage() {
  const result = await fetchInternalApi<AdminReportsResponse>("/api/admin/reports");

  if (!result.success || !result.data) {
    return (
      <PageShell title="Reports" description="Track platform summary and recent attempts.">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">{result.message}</p>
        </div>
      </PageShell>
    );
  }

  const { counts, averages, recentAttempts } = result.data;

  return (
    <PageShell title="Reports" description="Track platform summary and recent attempts.">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Total Students</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{counts.totalStudents}</p>
        </div>
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Active Students</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{counts.activeStudents}</p>
        </div>
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Total Questions</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{counts.totalQuestions}</p>
        </div>
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Total Tests</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{counts.totalTests}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Average Marks Obtained</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{Number(averages.averageMarksObtained).toFixed(2)}</p>
        </div>
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Average Percentage</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{Number(averages.averagePercentage).toFixed(2)}%</p>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Recent Attempts</h2>
        <div className="mt-4 space-y-4">
          {recentAttempts.length === 0 ? (
            <p className="text-sm text-slate-600">No attempts found.</p>
          ) : (
            recentAttempts.map((attempt) => (
              <div key={attempt.id} className="rounded-2xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{attempt.test.title}</p>
                    <p className="mt-1 text-sm text-slate-600">Student: {attempt.user.fullName}</p>
                    <p className="mt-1 text-sm text-slate-500">Status: {attempt.status}</p>
                  </div>
                  <span className="text-sm text-slate-500">
                    {new Date(attempt.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PageShell>
  );
}