import Link from "next/link";
import { examCategories } from "@/lib/constants/mock-data";
import { PageShell } from "@/components/shared/page-shell";

export default function ExamsListingPage() {
  return (
    <PageShell
      title="Exam Categories"
      description="Browse all available exam categories and choose the one you want to prepare for."
    >
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {examCategories.map((exam) => (
          <Link
            key={exam.slug}
            href={`/exams/${exam.slug}`}
            className="group rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="mb-4 h-14 w-14 rounded-2xl bg-blue-100" />
            <h2 className="text-lg font-semibold text-slate-900">{exam.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{exam.description}</p>
            <span className="mt-4 inline-flex text-sm font-semibold text-blue-600">Explore Category →</span>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}