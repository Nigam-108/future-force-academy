import { notFound } from "next/navigation";
import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";

type TestPaperPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type PaperPreviewResponse = {
  test: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    mode: string;
    structureType: string;
    visibilityStatus: string;
    totalQuestions: number;
    totalMarks: number;
    durationInMinutes: number | null;
    startAt: string | null;
    endAt: string | null;
  };
  sections: Array<{
    id: string;
    title: string;
    displayOrder: number;
    totalQuestions: number;
    durationInMinutes: number | null;
  }>;
  questions: Array<{
    assignmentId: string;
    questionNumber: number;
    displayOrder: number;
    sectionTitle: string | null;
    positiveMarks: number | null;
    negativeMarks: number | null;
    question: {
      id: string;
      questionText: string;
      optionA: string | null;
      optionB: string | null;
      optionC: string | null;
      optionD: string | null;
      correctAnswer: string | null;
      explanation: string | null;
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

export default async function TestPaperPage({ params }: TestPaperPageProps) {
  const { id } = await params;

  const result = await fetchInternalApi<PaperPreviewResponse>(
    `/api/admin/tests/${id}/paper-preview`
  );

  if (!result.success && result.status === 404) {
    notFound();
  }

  const data = result.data;

  return (
    <PageShell
      title="Test Paper Preview"
      description="Review the full final paper exactly in assigned question order."
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
            <p className="mt-2 text-sm text-slate-600">
              {data.test.description || "No description added."}
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
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

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Duration
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {data.test.durationInMinutes ?? "—"} min
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Mode
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {data.test.mode}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Structure
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {data.test.structureType}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Start
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {formatDateTime(data.test.startAt)}
                </p>
              </div>
            </div>
          </div>

          {data.questions.map((item) => (
            <div
              key={item.assignmentId}
              className="rounded-3xl border bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                    Question {item.questionNumber}
                    {item.sectionTitle ? ` • ${item.sectionTitle}` : ""}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">
                    {item.question.questionText}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                    +{item.positiveMarks ?? "—"}
                  </span>
                  <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">
                    -{item.negativeMarks ?? "—"}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {item.question.optionA ? (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                    <span className="font-semibold">A.</span> {item.question.optionA}
                  </div>
                ) : null}

                {item.question.optionB ? (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                    <span className="font-semibold">B.</span> {item.question.optionB}
                  </div>
                ) : null}

                {item.question.optionC ? (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                    <span className="font-semibold">C.</span> {item.question.optionC}
                  </div>
                ) : null}

                {item.question.optionD ? (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                    <span className="font-semibold">D.</span> {item.question.optionD}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}