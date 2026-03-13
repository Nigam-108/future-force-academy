import { notFound } from "next/navigation";
import { featuredSeries } from "@/lib/constants/mock-data";
import { PageShell } from "@/components/shared/page-shell";

type TestSeriesPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function SingleTestSeriesPage({
  params,
}: TestSeriesPageProps) {
  const { slug } = await params;

  const series = featuredSeries.find((item) => item.slug === slug);

  if (!series) {
    notFound();
  }

  return (
    <PageShell
      title={series.title}
      description="Test series details and purchase/start actions."
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {series.type}
            </span>
            <span className="text-sm font-medium text-blue-700">
              {series.exam}
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            {series.title}
          </h1>
          <p className="mt-4 text-slate-600">{series.description}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border p-5">
              <p className="text-sm text-slate-500">Number of Tests</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">15</p>
            </div>
            <div className="rounded-2xl border p-5">
              <p className="text-sm text-slate-500">Validity</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                180 Days
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Included Features
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>• Full-length mock tests</li>
              <li>• Section-wise practice tests</li>
              <li>• Result and performance tracking</li>
              <li>• Multilingual question support where available</li>
            </ul>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Action Panel</h2>
          <p className="mt-3 text-sm text-slate-600">
            Start this series if free, or purchase and unlock all included
            tests.
          </p>
          <div className="mt-6 space-y-3">
            <button className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
              {series.type === "Free" ? "Start Now" : "Buy Test Series"}
            </button>
            <button className="w-full rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Save for Later
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}