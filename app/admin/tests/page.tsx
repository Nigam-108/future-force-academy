import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";

const tests = [
  { id: "T-201", title: "WPSI Full Mock Test 01", mode: "Live", status: "Draft" },
  { id: "T-202", title: "UPSC CSAT Practice Set", mode: "Practice", status: "Live" },
  { id: "T-203", title: "GPSC Sectional Test", mode: "Assigned", status: "Closed" }
];

export default function AdminTestsPage() {
  return (
    <PageShell title="Tests" description="Create, edit, clone, and manage all tests across exams and categories.">
      <div className="mb-6 flex flex-wrap gap-3">
        <Link href="/admin/tests/new" className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          Create Test
        </Link>
        <Link href="/admin/tests/templates" className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
          View Templates
        </Link>
      </div>

      <div className="space-y-4">
        {tests.map((test) => (
          <div key={test.id} className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{test.id}</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">{test.title}</h2>
                <p className="mt-1 text-sm text-slate-600">Mode: {test.mode} · Status: {test.status}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href={`/admin/tests/${test.id}/edit`} className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                  Edit
                </Link>
                <button className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                  Clone
                </button>
                <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                  Preview
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
