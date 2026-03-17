import { notFound } from "next/navigation";
import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";

type AnalyticsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type AnalyticsResponse = {
  test: {
    id: string;
    title: string;
    slug: string;
    totalQuestions: number;
    totalMarks: number;
    mode: string;
    structureType: string;
    visibilityStatus: string;
  };
  summary: {
    totalAttempts: number;
    submittedCount: number;
    inProgressCount: number;
    averageMarks: number;
    averagePercentage: number;
    highestMarks: number;
    highestPercentage: number;
  };
  attempts: Array<{
    id: string;
    status: string;
    startedAt: string | null;
    submittedAt: string | null;
    totalMarksObtained: number | null;
    percentage: number | null;
    correctCount: number | null;
    wrongCount: number | null;
    unansweredCount: number | null;
    user: {
      id: string | null;
      fullName: string;
      email: string;
    };
  }>;
};

function formatDateTime(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

/**
 * Admin analytics page for one test.
 *
 * Goal:
 * - provide meaningful performance insight
 * - keep the UI clean and readable
 */
export default async function TestAnalyticsPage({
  params,
}: AnalyticsPageProps) {
  const { id } = await params;

  const result = await fetchInternalApi<AnalyticsResponse>(
    `/api/admin/tests/${id}/analytics`
  );

  if (!result.success && result.status === 404) {
    notFound();
  }

  const data = result.data;

  return (
    <PageShell
      title="Test Analytics"
      description="Review participation and performance metrics for this test."
    >
      {!result.success || !data ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {result.message}
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">
              {data.test.title}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Slug: {data.test.slug}
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Total Attempts
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {data.summary.totalAttempts}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Submitted
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {data.summary.submittedCount}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  In Progress
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {data.summary.inProgressCount}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Avg Marks
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {data.summary.averageMarks}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Avg %
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {data.summary.averagePercentage}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Highest Marks
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {data.summary.highestMarks}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              Attempt Records
            </h3>

            {data.attempts.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">
                No attempts found for this test yet.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 text-left">
                      <th className="px-4 py-3 font-semibold text-slate-700">Student</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Marks</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">%</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Correct</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Wrong</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Unanswered</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Started</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.attempts.map((attempt) => (
                      <tr key={attempt.id} className="border-b">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">
                            {attempt.user.fullName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {attempt.user.email}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{attempt.status}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {attempt.totalMarksObtained ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {attempt.percentage ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {attempt.correctCount ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {attempt.wrongCount ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {attempt.unansweredCount ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {formatDateTime(attempt.startedAt)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {formatDateTime(attempt.submittedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </PageShell>
  );
}