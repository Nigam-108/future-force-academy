import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";

type PageProps = {
  params: Promise<{
    testId: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type SubmittedResultResponse = {
  summary: {
    attemptId: string;
    testId: string;
    testTitle: string;
    status: string;
    startedAt: string | null;
    submittedAt: string | null;
    totalMarksObtained: number | null;
    correctCount: number;
    wrongCount: number;
    unansweredCount: number;
    percentage: number | null;
    rank: number | null;
  };
};

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDateTime(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function TestSubmittedPage({
  searchParams,
}: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const attemptId = getSingleValue(resolvedSearchParams.attemptId);

  if (!attemptId) {
    return (
      <PageShell
        title="Submission Status"
        description="Your attempt submission page."
      >
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          Missing attemptId. Open this page only after submitting a real attempt.
        </div>
      </PageShell>
    );
  }

  const result = await fetchInternalApi<SubmittedResultResponse>(
    `/api/attempts/result?attemptId=${encodeURIComponent(attemptId)}`
  );

  return (
    <PageShell
      title="Test Submitted"
      description="Your attempt has been submitted through the real backend flow."
    >
      {!result.success || !result.data ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {result.message}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-emerald-600">
                  Submission Complete
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  {result.data.summary.testTitle}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Your attempt has been submitted successfully. You can now view
                  the result summary or go back to your tests list.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Score</div>
                <div className="mt-1 text-xl font-bold text-slate-900">
                  {result.data.summary.totalMarksObtained ?? 0}
                </div>
              </div>

              <div className="rounded-2xl border bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Correct</div>
                <div className="mt-1 text-xl font-bold text-slate-900">
                  {result.data.summary.correctCount}
                </div>
              </div>

              <div className="rounded-2xl border bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Wrong</div>
                <div className="mt-1 text-xl font-bold text-slate-900">
                  {result.data.summary.wrongCount}
                </div>
              </div>

              <div className="rounded-2xl border bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Percentage</div>
                <div className="mt-1 text-xl font-bold text-slate-900">
                  {result.data.summary.percentage ?? 0}%
                </div>
              </div>
            </div>
          </section>

          <aside className="rounded-3xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              Submission Details
            </h3>

            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex items-start justify-between gap-4 border-b pb-3">
                <dt className="text-slate-500">Started At</dt>
                <dd className="text-right font-medium text-slate-900">
                  {formatDateTime(result.data.summary.startedAt)}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4 border-b pb-3">
                <dt className="text-slate-500">Submitted At</dt>
                <dd className="text-right font-medium text-slate-900">
                  {formatDateTime(result.data.summary.submittedAt)}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4 border-b pb-3">
                <dt className="text-slate-500">Unanswered</dt>
                <dd className="font-medium text-slate-900">
                  {result.data.summary.unansweredCount}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Status</dt>
                <dd className="font-medium text-slate-900">
                  {result.data.summary.status}
                </dd>
              </div>
            </dl>

            <div className="mt-6 space-y-3">
              <Link
                href={`/student/results/${result.data.summary.attemptId}`}
                className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
              >
                View Full Result
              </Link>

              <Link
                href="/student/tests"
                className="inline-flex w-full items-center justify-center rounded-xl border px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Back to Tests
              </Link>
            </div>
          </aside>
        </div>
      )}
    </PageShell>
  );
}