import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";

const purchases = [
  { id: "series-1", title: "WPSI Full Mock Test Series", status: "Active", validity: "180 days" },
  { id: "series-2", title: "GPSC Aptitude Series", status: "Active", validity: "120 days" }
];

export default function PurchasesPage() {
  return (
    <PageShell title="My Purchases" description="View purchased test series, access status, and validity details.">
      <div className="space-y-4">
        {purchases.map((item) => (
          <div key={item.id} className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
                <p className="mt-1 text-sm text-slate-600">Validity: {item.validity}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{item.status}</span>
                <Link href={`/student/purchases/${item.id}`} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  Open Series
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}