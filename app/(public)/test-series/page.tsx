import Link from "next/link";
import { featuredSeries } from "@/lib/constants/mock-data";
import { PageShell } from "@/components/shared/page-shell";

export default function TestSeriesListingPage() {
  return (
    <PageShell
      title="Test Series"
      description="Explore featured test series for different exams, including free and paid options."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {featuredSeries.map((series) => (
          <div key={series.slug} className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{series.title}</h2>
                <p className="mt-1 text-sm font-medium text-blue-700">{series.exam}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {series.type}
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-600">{series.description}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/test-series/${series.slug}`}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                View Details
              </Link>
              <button className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                {series.type === "Free" ? "Start Free" : "Buy Series"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}