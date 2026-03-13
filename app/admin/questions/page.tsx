import Link from "next/link";
import { QuestionTable } from "@/components/admin/question-table";
import { PageShell } from "@/components/shared/page-shell";

export default function QuestionsPage() {
  return (
    <PageShell title="Question Bank" description="Search, filter, manage, and review all questions across exams and courses.">
      <div className="mb-6 grid gap-4 rounded-3xl border bg-white p-5 shadow-sm lg:grid-cols-6">
        <input className="rounded-xl border px-4 py-3 lg:col-span-2" placeholder="Search questions" />
        <select className="rounded-xl border px-4 py-3">
          <option>All Exams</option>
        </select>
        <select className="rounded-xl border px-4 py-3">
          <option>All Types</option>
        </select>
        <select className="rounded-xl border px-4 py-3">
          <option>All Difficulty</option>
        </select>
        <select className="rounded-xl border px-4 py-3">
          <option>All Status</option>
        </select>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link href="/admin/questions/new" className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          Add Question
        </Link>
        <Link href="/admin/questions/import" className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
          Import Questions
        </Link>
      </div>

      <QuestionTable />
    </PageShell>
  );
}
