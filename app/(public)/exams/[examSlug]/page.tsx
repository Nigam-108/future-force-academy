import Link from "next/link";
import { notFound } from "next/navigation";
import { examCategories, featuredSeries } from "@/lib/constants/mock-data";
import { PageShell } from "@/components/shared/page-shell";

type ExamPageProps = {
  params: Promise<{ examSlug: string }>;
};

export default async function SingleExamCategoryPage({
  params,
}: ExamPageProps) {
  const { examSlug } = await params;

  const exam = examCategories.find((item) => item.slug === examSlug);

  if (!exam) {
    notFound();
  }

  const filteredSeries = featuredSeries.filter(
    (series) =>
      series.exam.toLowerCase().includes(exam.name.toLowerCase().split(" ")[0]) ||
      exam.slug.includes(series.exam.toLowerCase().split(" ")[0])
  );

  return (
    <>
      <section className="border-b bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm text-slate-200">
              Exam Category
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
              {exam.name}
            </h1>
            <p className="mt-4 text-lg text-slate-300">{exam.description}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/test-series"
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                View Test Series
              </Link>
              <Link
                href="/signup"
                className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Signup to Start
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PageShell
        title={`${exam.name} Overview`}
        description="Explore subcategories, featured tests, and free or paid options."
      >
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">
                Subcategories / Courses
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border p-5">
                  <h3 className="font-semibold text-slate-900">
                    Foundation Course
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Topic-wise and section-wise structured practice.
                  </p>
                </div>
                <div className="rounded-2xl border p-5">
                  <h3 className="font-semibold text-slate-900">
                    Mock Test Series
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Full-length and timed exam simulation test sets.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">
                Free Tests
              </h2>
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border p-5">
                  <h3 className="font-semibold text-slate-900">
                    Starter Practice Test
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Begin with a free structured test before moving to advanced
                    series.
                  </p>
                  <button className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                    Start Free Test
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              Featured Paid Series
            </h2>
            <div className="mt-4 space-y-4">
              {(filteredSeries.length ? filteredSeries : featuredSeries.slice(0, 2)).map(
                (series) => (
                  <div key={series.slug} className="rounded-2xl border p-5">
                    <h3 className="font-semibold text-slate-900">
                      {series.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {series.description}
                    </p>
                    <Link
                      href={`/test-series/${series.slug}`}
                      className="mt-4 inline-flex rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      View Details
                    </Link>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </PageShell>
    </>
  );
}