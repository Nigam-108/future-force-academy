import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";

export const dynamic = "force-dynamic";

type PaymentHistoryItem = {
  id: string;
  amount: number;
  amountFormatted: string;
  currency: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  gateway: "RAZORPAY" | "MANUAL";
  orderId: string | null;
  paymentId: string | null;
  notes: string | null;
  paidAt: string | null;
  createdAt: string;
  batch: {
    id: string;
    title: string;
    examType: string;
    isPaid: boolean;
  };
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

function statusDescription(status: string) {
  switch (status) {
    case "SUCCESS":
      return "Payment completed. Batch access granted.";
    case "PENDING":
      return "Payment not completed. Try again from enrollments page.";
    case "FAILED":
      return "Payment failed or was cancelled.";
    case "REFUNDED":
      return "Payment refunded. Batch access has been revoked.";
    default:
      return "";
  }
}

export default async function StudentPaymentsPage() {
  const result = await fetchInternalApi<PaymentHistoryItem[]>(
    "/api/student/payments/history"
  );

  const payments = result.data ?? [];
  const successCount = payments.filter((p) => p.status === "SUCCESS").length;
  const pendingCount = payments.filter((p) => p.status === "PENDING").length;
  const failedCount = payments.filter(
    (p) => p.status === "FAILED" || p.status === "REFUNDED"
  ).length;

  return (
    <PageShell
      title="Payment History"
      description="View all your payment attempts and their current status."
    >
      <div className="space-y-6">

        {/* Back link */}
        <Link
          href="/student/purchases"
          className="inline-flex rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ← Back to Enrollments
        </Link>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Successful</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-700">
              {successCount}
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Pending</p>
            <p className="mt-1 text-2xl font-semibold text-amber-600">
              {pendingCount}
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Failed / Refunded</p>
            <p className="mt-1 text-2xl font-semibold text-rose-600">
              {failedCount}
            </p>
          </div>
        </div>

        {/* Pending notice */}
        {pendingCount > 0 ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
            <p className="font-semibold text-amber-800">
              ⚠️ You have {pendingCount} pending payment
              {pendingCount !== 1 ? "s" : ""}
            </p>
            <p className="mt-1 text-sm text-amber-700">
              Pending payments were not completed. You can try again from the{" "}
              <Link
                href="/student/purchases"
                className="font-semibold underline"
              >
                Enrollments page
              </Link>
              . If you believe a payment was deducted, contact your admin.
            </p>
          </div>
        ) : null}

        {/* Payment list */}
        {!result.success ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {result.message}
          </div>
        ) : payments.length === 0 ? (
          <div className="rounded-3xl border border-dashed bg-white p-10 text-center">
            <h2 className="text-xl font-semibold text-slate-900">
              No payment history
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Your payment attempts will appear here once you try to enroll in a
              paid batch.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="rounded-3xl border bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
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

                    <p className="text-lg font-semibold text-slate-900">
                      {payment.amountFormatted}
                    </p>

                    <p className="text-sm font-medium text-slate-700">
                      {payment.batch.title}
                    </p>

                    <p className="text-xs text-slate-500">
                      {statusDescription(payment.status)}
                    </p>
                  </div>

                  <div className="text-right text-sm text-slate-500">
                    <p>
                      {payment.paidAt
                        ? `Paid: ${formatDateTime(payment.paidAt)}`
                        : `Attempted: ${formatDateTime(payment.createdAt)}`}
                    </p>
                    {payment.orderId ? (
                      <p className="mt-1 text-xs text-slate-400 break-all">
                        Order: {payment.orderId.slice(0, 20)}...
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Retry button for FAILED payments */}
                {(payment.status === "FAILED" ||
                  payment.status === "PENDING") ? (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <Link
                      href="/student/purchases"
                      className="inline-flex rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Try Again → Go to Enrollments
                    </Link>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}