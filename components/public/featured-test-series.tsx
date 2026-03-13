import Link from "next/link";
import { featuredSeries } from "@/lib/constants/mock-data";

export function FeaturedTestSeries() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Featured Test Series</h2>
          <p className="mt-2 text-slate-600">
            Selected free and paid series with strong exam-focused structure.
          </p>
        </div>
        <Link href="/test-series" className="text-sm font-semibold text-blue-600">
          View all
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {featuredSeries.map((series) => (
          <div key={series.slug} className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-slate-900">{series.title}</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {series.type}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-blue-700">{series.exam}</p>
            <p className="mt-3 text-sm text-slate-600">{series.description}</p>
            <Link
              href={`/test-series/${series.slug}`}
              className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              View Details
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}