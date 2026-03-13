import { PaymentTable } from "@/components/admin/payment-table";
import { PageShell } from "@/components/shared/page-shell";

export default function PaymentsPage() {
  return (
    <PageShell title="Payments" description="View payment status, linked student details, and review special payment cases.">
      <div className="mb-6 grid gap-4 rounded-3xl border bg-white p-5 shadow-sm lg:grid-cols-4">
        <input className="rounded-xl border px-4 py-3 lg:col-span-2" placeholder="Search payment or student" />
        <select className="rounded-xl border px-4 py-3">
          <option>All Status</option>
          <option>Success</option>
          <option>Pending</option>
          <option>Failed</option>
        </select>
        <button className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
          Export Payments
        </button>
      </div>

      <PaymentTable />
    </PageShell>
  );
}
