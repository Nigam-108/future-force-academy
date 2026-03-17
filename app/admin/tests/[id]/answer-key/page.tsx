import { notFound } from "next/navigation";
import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";

type AnswerKeyPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type AnswerKeyResponse = {
  test: {
    id: string;
    title: string;
    slug: string;
    totalQuestions: number;
    totalMarks: number;
  };
  questions: Array<{
    questionNumber: number;
    sectionTitle: string | null;
    correctAnswer: string | null;
    explanation: string | null;
    positiveMarks: number | null;
    negativeMarks: number | null;
    questionText: string;
  }>;
};

export default async function TestAnswerKeyPage({
  params,
}: AnswerKeyPageProps) {
  const { id } = await params;

  const result = await fetchInternalApi<AnswerKeyResponse>(
    `/api/admin/tests/${id}/answer-key`
  );

  if (!result.success && result.status === 404) {
    notFound();
  }

  const data = result.data;

  return (
    <PageShell
      title="Answer Key Preview"
      description="Review correct answers and explanations for the full test."
    >
      {!result.success || !data ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {result.message}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">
              {data.test.title}
            </h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Total Questions
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {data.test.totalQuestions}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Total Marks
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {data.test.totalMarks}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {data.questions.map((item) => (
              <div
                key={item.questionNumber}
                className="rounded-3xl border bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                      Question {item.questionNumber}
                      {item.sectionTitle ? ` • ${item.sectionTitle}` : ""}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">
                      {item.questionText}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
                      Correct: {item.correctAnswer || "—"}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                      +{item.positiveMarks ?? "—"}
                    </span>
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">
                      -{item.negativeMarks ?? "—"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Explanation</p>
                  <p className="mt-2">
                    {item.explanation?.trim() || "No explanation added."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}