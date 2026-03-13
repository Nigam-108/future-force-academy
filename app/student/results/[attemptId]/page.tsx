import { PageShell } from "@/components/shared/page-shell";
import { ResultSummaryCard } from "@/components/student/result-summary-card";

export default function SingleResultPage() {
  return (
    <PageShell title="Result Details" description="Detailed performance summary, score, rank, and answer review.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <ResultSummaryCard label="Total Marks" value="78" />
        <ResultSummaryCard label="Rank" value="12" />
        <ResultSummaryCard label="Percentage" value="78%" />
        <ResultSummaryCard label="Correct" value="82" />
        <ResultSummaryCard label="Wrong" value="14" />
        <ResultSummaryCard label="Time Taken" value="84m" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Section-wise Marks</h2>
            <div className="mt-4 space-y-4 text-sm text-slate-700">
              <div className="rounded-2xl border p-4">Aptitude — 24 / 30</div>
              <div className="rounded-2xl border p-4">Reasoning — 28 / 35</div>
              <div className="rounded-2xl border p-4">Subject — 26 / 35</div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Answer Review</h2>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border p-5">
              <p className="text-sm text-slate-500">Question 1</p>
              <h3 className="mt-2 font-semibold text-slate-900">Which of the following is the correct next number in the series?</h3>
              <p className="mt-3 text-sm text-slate-600"><span className="font-semibold text-slate-900">Selected Answer:</span> 168</p>
              <p className="mt-1 text-sm text-slate-600"><span className="font-semibold text-slate-900">Correct Answer:</span> 192</p>
              <p className="mt-3 text-sm text-slate-600">Explanation: The pattern doubles each time, so 96 × 2 = 192.</p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}