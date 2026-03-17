import { notFound } from "next/navigation";
import { PrintPageActions } from "@/components/admin/print-page-actions";
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

/**
 * Paper preview page.
 *
 * Key design goals:
 * - pleasant on screen
 * - clean when printed
 * - each question block should avoid awkward page splits where possible
 */
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
      description="Review the final paper in assigned order and print or save it as PDF."
    >
      {!result.success || !data ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {result.message}
        </div>
      ) : (
        <div className="space-y-6">
          <PrintPageActions />

          {/* Printable page body */}
          <div className="mx-auto max-w-5xl space-y-6 print:max-w-none">
            {/* Header card */}
            <section className="rounded-3xl border bg-white p-6 shadow-sm print:rounded-none print:border print:shadow-none">
              <div className="border-b border-slate-200 pb-4">
                <h1 className="text-3xl font-bold text-slate-900 print:text-2xl">
                  {data.test.title}
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  {data.test.description || "No description added."}
                </p>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                <div className="rounded-2xl bg-slate-50 p-4 print:border print:bg-transparent">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Total Questions
                  </p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {data.test.totalQuestions}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 print:border print:bg-transparent">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Total Marks
                  </p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {data.test.totalMarks}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 print:border print:bg-transparent">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Duration
                  </p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {data.test.durationInMinutes ?? "—"} min
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 print:border print:bg-transparent">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Mode
                  </p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {data.test.mode}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 print:border print:bg-transparent">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Structure
                  </p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {data.test.structureType}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 print:border print:bg-transparent">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Start Window
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {formatDateTime(data.test.startAt)}
                  </p>
                </div>
              </div>
            </section>

            {/* Optional section summary */}
            {data.sections.length > 0 ? (
              <section className="rounded-3xl border bg-white p-6 shadow-sm print:rounded-none print:border print:shadow-none">
                <h2 className="text-lg font-semibold text-slate-900">Sections</h2>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {data.sections.map((section) => (
                    <div
                      key={section.id}
                      className="rounded-2xl bg-slate-50 p-4 print:border print:bg-transparent"
                    >
                      <p className="font-semibold text-slate-900">
                        {section.displayOrder}. {section.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {section.totalQuestions} questions
                        {section.durationInMinutes
                          ? ` • ${section.durationInMinutes} min`
                          : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {/* Question list */}
            <section className="space-y-5">
              {data.questions.map((item) => (
                <article
                  key={item.assignmentId}
                  className="break-inside-avoid rounded-3xl border bg-white p-6 shadow-sm print:rounded-none print:border print:shadow-none"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
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
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 print:border print:bg-transparent">
                        +{item.positiveMarks ?? "—"}
                      </span>
                      <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700 print:border print:bg-transparent">
                        -{item.negativeMarks ?? "—"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {item.question.optionA ? (
                      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 print:border print:bg-transparent">
                        <span className="font-semibold">A.</span>{" "}
                        {item.question.optionA}
                      </div>
                    ) : null}

                    {item.question.optionB ? (
                      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 print:border print:bg-transparent">
                        <span className="font-semibold">B.</span>{" "}
                        {item.question.optionB}
                      </div>
                    ) : null}

                    {item.question.optionC ? (
                      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 print:border print:bg-transparent">
                        <span className="font-semibold">C.</span>{" "}
                        {item.question.optionC}
                      </div>
                    ) : null}

                    {item.question.optionD ? (
                      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 print:border print:bg-transparent">
                        <span className="font-semibold">D.</span>{" "}
                        {item.question.optionD}
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </section>
          </div>
        </div>
      )}
    </PageShell>
  );
}