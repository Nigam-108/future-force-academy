import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";

const results = [
  { id: "attempt-1", title: "WPSI Full Mock Test 01", exam: "Wireless PSI", status: "Available" },
  { id: "attempt-2", title: "UPSC CSAT Practice Test", exam: "UPSC", status: "Available" },
  { id: "attempt-3", title: "GPSC Sectional Aptitude", exam: "GPSC", status: "Available" }
];

export default function ResultsListingPage() {
  return (
    <PageShell title="Results" description="View all completed test results and open detailed scorecards.">
      <div className="space-y-4">
        {results.map((result) => (
          <div key={result.id} className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{result.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{result.exam}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{result.status}</span>
                <Link href={`/student/results/${result.id}`} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  View Result
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}