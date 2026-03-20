import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";

type PaymentDetailPageProps = {
  params: Promise<{ paymentId: string }>;
};

type PaymentDetailResponse = {
  id: string;
  amount: number;
  amountFormatted: string;
  currency: string;
  status: string;
  gateway: string;
  orderId: string | null;
  paymentId: string | null;
  notes: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    mobileNumber: string | null;
  };
  batch: {
    id: string;
    title: string;
    slug: string;
    examType: string;
    isPaid: boolean;
  };
  purchases: Array<{
    id: string;
    status: string;
    validFrom: string;
    validUntil: string | null;
    createdAt: string;
  }>;
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
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "CANCELLED":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

export default async function PaymentDetailPage({
  params,
}: PaymentDetailPageProps) {
  const { paymentId } = await params;

  const result = await fetchInternalApi<PaymentDetailResponse>(
    `/api/admin/payments/${paymentId}`
  );

  if (!result.success && result.status === 404) {
    notFound();
  }

  if (!result.success || !result.data) {
    return (
      <PageShell title="Payment Detail" description="View payment record.">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {result.message}
        </div>
      </PageShell>
    );
  }

  const payment = result.data;

  return (
    <PageShell
      title="Payment Detail"
      description="Full payment record with purchase and student info."
    >
      {/* Back navigation */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/admin/payments"
          className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ← Back to Payments
        </Link>
        <Link
          href={`/admin/students/${payment.user.id}`}
          className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          View Student
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left — main details */}
        <div className="space-y-6">

          {/* Payment record */}
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Payment Record
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  {payment.amountFormatted}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  ID: {payment.id}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(
                    payment.status
                  )}`}
                >
                  {payment.status}
                </span>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
                  {payment.gateway}
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Paid At
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatDateTime(payment.paidAt)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Created At
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatDateTime(payment.createdAt)}
                </p>
              </div>

              {payment.orderId ? (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Order ID
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 break-all">
                    {payment.orderId}
                  </p>
                </div>
              ) : null}

              {payment.paymentId ? (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Gateway Payment ID
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 break-all">
                    {payment.paymentId}
                  </p>
                </div>
              ) : null}
            </div>

            {payment.notes ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Notes
                </p>
                <p className="mt-1 text-sm text-slate-700">{payment.notes}</p>
              </div>
            ) : null}
          </div>

          {/* Purchase records linked to this payment */}
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              Linked Purchase Records
            </h3>

            {payment.purchases.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">
                No purchase records linked to this payment yet.
                {payment.status === "SUCCESS"
                  ? " This is unexpected — please check manually."
                  : " Purchases are created automatically when payment succeeds."}
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {payment.purchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Purchase ID: {purchase.id}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Valid: {formatDateTime(purchase.validFrom)} →{" "}
                          {purchase.validUntil
                            ? formatDateTime(purchase.validUntil)
                            : "No expiry"}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(
                          purchase.status
                        )}`}
                      >
                        {purchase.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — student + batch */}
        <div className="space-y-6">

          {/* Student info */}
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Student</h3>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white">
                {payment.user.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  {payment.user.fullName}
                </p>
                <p className="text-sm text-slate-500">{payment.user.email}</p>
                {payment.user.mobileNumber ? (
                  <p className="text-sm text-slate-500">
                    {payment.user.mobileNumber}
                  </p>
                ) : null}
              </div>
            </div>

            <Link
              href={`/admin/students/${payment.user.id}`}
              className="mt-5 block rounded-xl border px-4 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              View Full Student Profile
            </Link>
          </div>

          {/* Batch info */}
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Batch</h3>

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-sm text-slate-500">Batch Name</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {payment.batch.title}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Exam Type</p>
                <p className="mt-1 font-medium text-slate-900">
                  {payment.batch.examType}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Batch Type</p>
                <p className="mt-1 font-medium text-slate-900">
                  {payment.batch.isPaid ? "Paid" : "Free"}
                </p>
              </div>
            </div>

            <Link
              href={`/admin/batches`}
              className="mt-5 block rounded-xl border px-4 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              View All Batches
            </Link>
          </div>

          {/* Quick status change */}
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              Update Status
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Use the payments list page to change this payment&apos;s status.
              Status changes automatically create or cancel purchase records.
            </p>
            <Link
              href="/admin/payments"
              className="mt-4 block rounded-xl bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-slate-800"
            >
              Go to Payments List
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}