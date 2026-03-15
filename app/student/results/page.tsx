import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";

type StudentResultsListResponse = Array<{
  id: string;
  testId: string;
  status: string;
  totalMarksObtained: number | null;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  percentage: number | null;
  submittedAt: string | null;
  test: {
    id: string;
    title: string;
    slug: string;
    mode: string;
    totalMarks: number;
  };
}>;

export default async function StudentResultsPage() {
  const result = await fetchInternalApi<StudentResultsListResponse>("/api/student/results");

  return (
    <PageShell title="Results" description="Track marks, rank, and performance review.">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Submitted Results</h2>
        <div className="mt-4 space-y-4">
          {!result.success || !result.data ? (
            <p className="text-sm text-slate-600">{result.message}</p>
          ) : result.data.length === 0 ? (
            <p className="text-sm text-slate-600">No submitted results found.</p>
          ) : (
            result.data.map((item) => (
              <div key={item.id} className="rounded-2xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{item.test.title}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Score: {item.totalMarksObtained ?? 0} / {item.test.totalMarks} • Percentage: {item.percentage ?? 0}%
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Correct: {item.correctCount} • Wrong: {item.wrongCount} • Unanswered: {item.unansweredCount}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs text-slate-500">
                      {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : "Not submitted"}
                    </span>
                    <Link
                      href={`/student/results/${item.id}`}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      View Result
                    </Link>
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