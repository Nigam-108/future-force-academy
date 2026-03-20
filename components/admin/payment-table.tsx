"use client";

import Link from "next/link";

type Payment = {
  id: string;
  amountFormatted: string;
  status: string;
  gateway: string;
  paidAt: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  batch: {
    id: string;
    title: string;
    examType: string;
  };
};

type Props = {
  payments: Payment[];
};

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "SUCCESS":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "PENDING":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "FAILED":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    case "REFUNDED":
      return "bg-slate-100 text-slate-600 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

export function PaymentTable({ payments }: Props) {
  if (payments.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed bg-white p-8 text-center">
        <p className="text-sm text-slate-600">No payments found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Student
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Batch
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Amount
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Gateway
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Date
              </th>
              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-slate-50">
                <td className="px-5 py-4">
                  <p className="font-medium text-slate-900">
                    {payment.user.fullName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {payment.user.email}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <p className="text-sm font-medium text-slate-900">
                    {payment.batch.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {payment.batch.examType}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {payment.amountFormatted}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(
                      payment.status
                    )}`}
                  >
                    {payment.status}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
                    {payment.gateway}
                  </span>
                </td>

                <td className="px-5 py-4 text-sm text-slate-600">
                  {formatDateTime(payment.paidAt ?? payment.createdAt)}
                </td>

                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/admin/payments/${payment.id}`}
                    className="rounded-xl border px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View Detail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
