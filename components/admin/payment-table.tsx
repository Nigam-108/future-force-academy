const payments = [
  {
    id: "P-301",
    student: "Nigam Student",
    amount: "₹299",
    status: "Success",
    series: "WPSI Full Mock Test Series"
  },
  {
    id: "P-302",
    student: "Aarav Patel",
    amount: "₹199",
    status: "Pending",
    series: "GPSC Aptitude Series"
  },
  {
    id: "P-303",
    student: "Riya Shah",
    amount: "₹149",
    status: "Failed",
    series: "UPSC CSAT Practice Set"
  }
];

export function PaymentTable() {
  return (
    <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Payment ID</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Student</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Series</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="px-5 py-4 text-sm font-medium text-slate-900">{payment.id}</td>
                <td className="px-5 py-4 text-sm text-slate-700">{payment.student}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{payment.series}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{payment.amount}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{payment.status}</td>
                <td className="px-5 py-4 text-right">
                  <button className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
