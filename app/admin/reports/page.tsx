import { PageShell } from "@/components/shared/page-shell";
import { MetricCard } from "@/components/shared/metric-card";

export default function ReportsPage() {
  return (
    <PageShell title="Reports & Analytics" description="Track attempts, scores, difficulty trends, growth, and performance data.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Attempts" value="4,812" />
        <MetricCard label="Average Score" value="67%" />
        <MetricCard label="Top Rankers" value="150" />
        <MetricCard label="Drop-off Cases" value="84" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Analytics Summary</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>• Section-wise performance insights</p>
            <p>• Test-wise analytics and average marks</p>
            <p>• Difficult question analysis</p>
            <p>• Revenue-linked analytics</p>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Export Options</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">Export Results</button>
            <button className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">Export Payments</button>
            <button className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">Download Report</button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
