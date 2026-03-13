import { PageShell } from "@/components/shared/page-shell";

const seriesTests = [
  { title: "Mock Test 01", status: "Attempted", type: "Practice" },
  { title: "Mock Test 02", status: "Available", type: "Live" },
  { title: "Mock Test 03", status: "Locked", type: "Practice" }
];

export default function PurchasedSeriesInnerPage() {
  return (
    <PageShell title="Purchased Test Series" description="View all tests inside your purchased series and continue from here.">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">WPSI Full Mock Test Series</h2>
        <div className="mt-6 space-y-4">
          {seriesTests.map((test) => (
            <div key={test.title} className="flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{test.title}</h3>
                <p className="mt-1 text-sm text-slate-600">Type: {test.type}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{test.status}</span>
                <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  {test.status === "Attempted" ? "Resume" : test.status === "Locked" ? "Locked" : "Start"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}