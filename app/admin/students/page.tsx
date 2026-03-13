import Link from "next/link";
import { StudentTable } from "@/components/admin/student-table";
import { PageShell } from "@/components/shared/page-shell";

export default function StudentsPage() {
  return (
    <PageShell title="Students" description="Search, filter, manage students, and assign tests or review activity.">
      <div className="mb-6 grid gap-4 rounded-3xl border bg-white p-5 shadow-sm lg:grid-cols-5">
        <input className="rounded-xl border px-4 py-3 lg:col-span-2" placeholder="Search by name or email" />
        <select className="rounded-xl border px-4 py-3">
          <option>All Courses</option>
        </select>
        <select className="rounded-xl border px-4 py-3">
          <option>All Status</option>
        </select>
        <Link href="/admin/students/batches" className="rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800">
          Manage Batches
        </Link>
      </div>

      <StudentTable />
    </PageShell>
  );
}
