import Link from "next/link";
import { examCategories } from "@/lib/constants/mock-data";

export function ExamCategoryGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Explore Exam Categories</h2>
        <p className="mt-2 text-slate-600">
          Choose your exam and start with free tests, paid series, and structured practice.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {examCategories.map((exam) => (
          <Link
            key={exam.slug}
            href={`/exams/${exam.slug}`}
            className="group rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="mb-4 h-12 w-12 rounded-2xl bg-blue-100" />
            <h3 className="text-lg font-semibold text-slate-900">{exam.name}</h3>
            <p className="mt-2 text-sm text-slate-600">{exam.description}</p>
            <span className="mt-4 inline-flex text-sm font-semibold text-blue-600">Explore →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}