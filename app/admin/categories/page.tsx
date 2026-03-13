import { PageShell } from "@/components/shared/page-shell";

const categories = [
  { name: "Wireless PSI & Technical Operator", type: "Exam", status: "Active" },
  { name: "UPSC", type: "Exam", status: "Active" },
  { name: "GPSC", type: "Exam", status: "Active" },
  { name: "Railway Exams", type: "Exam", status: "Inactive" }
];

export default function CategoriesPage() {
  return (
    <PageShell title="Categories & Courses" description="Manage exam categories, subcategories, course blocks, banners, and active status.">
      <div className="mb-6 grid gap-4 rounded-3xl border bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto]">
        <input className="rounded-xl border px-4 py-3" placeholder="Add new exam/category name" />
        <button className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Add Category</button>
      </div>

      <div className="space-y-4">
        {categories.map((item) => (
          <div key={item.name} className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{item.name}</h2>
                <p className="mt-1 text-sm text-slate-600">Type: {item.type} · Status: {item.status}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Edit</button>
                <button className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Banner</button>
                <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Toggle Status</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
