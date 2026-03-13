import { PageShell } from "@/components/shared/page-shell";

const batches = [
  { name: "WPSI Batch A", students: 120 },
  { name: "GPSC Batch 2026", students: 85 },
  { name: "UPSC CSAT Practice Group", students: 64 }
];

export default function BatchesPage() {
  return (
    <PageShell title="Batches & Groups" description="Create batches, assign students, and bulk assign tests to groups.">
      <div className="mb-6 rounded-3xl border bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <input className="rounded-xl border px-4 py-3" placeholder="Create new batch name" />
          <button className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Create Batch</button>
        </div>
      </div>

      <div className="space-y-4">
        {batches.map((batch) => (
          <div key={batch.name} className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{batch.name}</h2>
                <p className="mt-1 text-sm text-slate-600">Students: {batch.students}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">View Students</button>
                <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Assign Test</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
