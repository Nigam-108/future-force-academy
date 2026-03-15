import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";

type ResultDetailResponse = {
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
  sections: Array<{
    id: string;
    title: string;
    displayOrder: number;
  }>;
  answerReview: Array<{
    answerId: string;
    questionNumber: number;
    questionText: string;
    selectedAnswer: string | null;
    correctAnswer: string | null;
    explanation: string | null;
    isAnswered: boolean;
    isCorrect: boolean | null;
    markedForReview: boolean;
    sectionTitle: string | null;
  }>;
};

type PageProps = {
  params: Promise<{ attemptId: string }>;
};

export default async function StudentResultDetailPage({ params }: PageProps) {
  const { attemptId } = await params;
  const result = await fetchInternalApi<ResultDetailResponse>(`/api/student/results/${attemptId}`);

  if (!result.success || !result.data) {
    return (
      <PageShell title="Result Details" description="Detailed view of your submitted test.">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">{result.message}</p>
        </div>
      </PageShell>
    );
  }

  const { summary, answerReview } = result.data;

  return (
    <PageShell title="Result Details" description="Detailed view of your submitted test.">
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Score</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{summary.totalMarksObtained ?? 0}</p>
        </div>
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Correct</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{summary.correctCount}</p>
        </div>
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Wrong</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{summary.wrongCount}</p>
        </div>
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Percentage</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{summary.percentage ?? 0}%</p>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Answer Review</h2>
        <div className="mt-4 space-y-4">
          {answerReview.map((item) => (
            <div key={item.answerId} className="rounded-2xl border p-4">
              <p className="font-semibold text-slate-900">
                Q{item.questionNumber}. {item.questionText}
              </p>
              <div className="mt-3 grid gap-2 text-sm text-slate-600">
                <p>Selected Answer: {item.selectedAnswer ?? "Not Answered"}</p>
                <p>Correct Answer: {item.correctAnswer ?? "N/A"}</p>
                <p>Marked for Review: {item.markedForReview ? "Yes" : "No"}</p>
                <p>Result: {item.isCorrect === true ? "Correct" : item.isCorrect === false ? "Wrong" : "Unanswered"}</p>
                {item.explanation ? <p>Explanation: {item.explanation}</p> : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}