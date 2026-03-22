import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";
import { Trophy, Medal } from "lucide-react";

type RankInfo = {
  batchId: string;
  batchTitle: string;
  rank: number;
  totalAttempted: number;
  myScore: number;
};

type ResultDetailResponse = {
  ranks: RankInfo[];
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

// ─── Rank color based on position ─────────────────────────────────────────────
function getRankStyle(rank: number) {
  if (rank === 1) return { bg: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-700", icon: "text-yellow-500", label: "🥇 1st Place" };
  if (rank === 2) return { bg: "bg-slate-50", border: "border-slate-300", text: "text-slate-700", icon: "text-slate-500", label: "🥈 2nd Place" };
  if (rank === 3) return { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", icon: "text-orange-500", label: "🥉 3rd Place" };
  return { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: "text-amber-500", label: null };
}

// ─── Merit Rank Section ───────────────────────────────────────────────────────
function MeritRankSection({ ranks }: { ranks: RankInfo[] }) {
  if (ranks.length === 0) return null;

  return (
    <div className="mt-6 rounded-3xl border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={18} className="text-amber-500" />
        <h2 className="text-lg font-semibold text-slate-900">Merit Rank</h2>
        <span className="text-xs text-slate-400 ml-1">
          · live, updates as more students attempt
        </span>
      </div>

      <div className={`grid gap-4 ${ranks.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {ranks.map((r) => {
          const style = getRankStyle(r.rank);
          const percentile = r.totalAttempted > 0
            ? Math.round(((r.totalAttempted - r.rank) / r.totalAttempted) * 100)
            : 0;

          return (
            <div
              key={r.batchId}
              className={`rounded-2xl border ${style.border} ${style.bg} p-5`}
            >
              {/* Batch name — only show if multiple batches */}
              {ranks.length > 1 && (
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                  {r.batchTitle}
                </p>
              )}

              {/* Big rank number */}
              <div className="flex items-end gap-2">
                <span className={`text-4xl font-black ${style.text}`}>
                  #{r.rank}
                </span>
                <span className="text-sm text-slate-500 mb-1">
                  out of {r.totalAttempted} attempted
                </span>
              </div>

              {/* Special label for top 3 */}
              {style.label && (
                <p className="mt-1 text-sm font-bold text-slate-700">
                  {style.label}
                </p>
              )}

              {/* Percentile bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Better than</span>
                  <span className="font-semibold text-slate-700">{percentile}% of students</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-700"
                    style={{ width: `${percentile}%` }}
                  />
                </div>
              </div>

              {/* Total enrolled vs attempted */}
              <p className="mt-3 text-xs text-slate-400">
                {r.totalAttempted} student{r.totalAttempted !== 1 ? "s" : ""} attempted this test in your batch
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function StudentResultDetailPage({ params }: PageProps) {
  const { attemptId } = await params;
  const result = await fetchInternalApi<ResultDetailResponse>(
    `/api/student/results/${attemptId}`
  );

  if (!result.success || !result.data) {
    return (
      <PageShell title="Result Details" description="Detailed view of your submitted test.">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">{result.message}</p>
        </div>
      </PageShell>
    );
  }

  const { summary, answerReview, ranks } = result.data;

  return (
    <PageShell title="Result Details" description="Detailed view of your submitted test.">

      {/* ── Score Cards ── */}
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Score</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {summary.totalMarksObtained ?? 0}
          </p>
        </div>
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Correct</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {summary.correctCount}
          </p>
        </div>
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Wrong</p>
          <p className="mt-2 text-3xl font-bold text-rose-600">
            {summary.wrongCount}
          </p>
        </div>
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Percentage</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {summary.percentage ?? 0}%
          </p>
        </div>
      </div>

      {/* ── Merit Rank Section — live, batch-specific ── */}
      <MeritRankSection ranks={ranks} />

      {/* ── Answer Review ── */}
      <div className="mt-6 rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Answer Review</h2>
        <div className="mt-4 space-y-4">
          {answerReview.map((item) => (
            <div key={item.answerId} className="rounded-2xl border p-4">
              <p className="font-semibold text-slate-900">
                Q{item.questionNumber}. {item.questionText}
              </p>
              <div className="mt-3 grid gap-2 text-sm text-slate-600">
                <p>
                  Selected:{" "}
                  <span className={item.isCorrect === false ? "text-rose-600 font-medium" : ""}>
                    {item.selectedAnswer ?? "Not Answered"}
                  </span>
                </p>
                <p>
                  Correct:{" "}
                  <span className="text-emerald-600 font-medium">
                    {item.correctAnswer ?? "N/A"}
                  </span>
                </p>
                <p>
                  Result:{" "}
                  <span
                    className={
                      item.isCorrect === true
                        ? "text-emerald-600 font-semibold"
                        : item.isCorrect === false
                        ? "text-rose-600 font-semibold"
                        : "text-slate-400"
                    }
                  >
                    {item.isCorrect === true
                      ? "✅ Correct"
                      : item.isCorrect === false
                      ? "❌ Wrong"
                      : "⬜ Unanswered"}
                  </span>
                </p>
                {item.explanation ? (
                  <p className="mt-1 rounded-xl bg-slate-50 p-3 text-slate-600">
                    💡 {item.explanation}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
