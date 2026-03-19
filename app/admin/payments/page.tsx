import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";
import { ManualEnrollButton } from "@/components/admin/manual-enroll-button";
import { UpdatePaymentStatusButton } from "@/components/admin/update-payment-status-button";

export const dynamic = "force-dynamic";

// ─── Types ───────────────────────────────────────────────────────────────────

type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
type PaymentGateway = "RAZORPAY" | "MANUAL";

type PaymentItem = {
  id: string;
  amount: number;
  amountFormatted: string;
  currency: string;
  status: PaymentStatus;
  gateway: PaymentGateway;
  orderId: string | null;
  paymentId: string | null;
  notes: string | null;
  paidAt: string | null;
  createdAt: string;
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
};

type PaymentsResponse = {
  items: PaymentItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type PaymentStats = {
  total: number;
  success: number;
  pending: number;
  failed: number;
  totalRevenueFormatted: string;
};

type AdminPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusBadgeClass(status: PaymentStatus) {
  switch (status) {
    case "SUCCESS":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "PENDING":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "FAILED":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    case "REFUNDED":
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

function gatewayBadgeClass(gateway: PaymentGateway) {
  switch (gateway) {
    case "RAZORPAY":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "MANUAL":
      return "bg-purple-50 text-purple-700 ring-purple-200";
  }
}

function buildPageHref(
  currentSearchParams: Record<string, string | string[] | undefined>,
  nextPage: number
) {
  const params = new URLSearchParams();
  const search = getSingleValue(currentSearchParams.search);
  const status = getSingleValue(currentSearchParams.status);
  const gateway = getSingleValue(currentSearchParams.gateway);

  if (search) params.set("search", search);
  if (status) params.set("status", status);
  if (gateway) params.set("gateway", gateway);
  params.set("page", String(nextPage));
  params.set("limit", "20");

  return `/admin/payments?${params.toString()}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PaymentsPage({ searchParams }: AdminPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const page = getSingleValue(resolvedSearchParams.page) || "1";
  const limit = getSingleValue(resolvedSearchParams.limit) || "20";
  const search = getSingleValue(resolvedSearchParams.search) || "";
  const status = getSingleValue(resolvedSearchParams.status) || "";
  const gateway = getSingleValue(resolvedSearchParams.gateway) || "";

  const apiParams = new URLSearchParams();
  apiParams.set("page", page);
  apiParams.set("limit", limit);
  if (search) apiParams.set("search", search);
  if (status) apiParams.set("status", status);
  if (gateway) apiParams.set("gateway", gateway);

  const [paymentsResult, statsResult] = await Promise.all([
    fetchInternalApi<PaymentsResponse>(
      `/api/admin/payments?${apiParams.toString()}`
    ),
    fetchInternalApi<PaymentStats>("/api/admin/payments?statsOnly=true"),
  ]);

  const data = paymentsResult.data;
  const stats = statsResult.data;
  const currentPage = Number(page);

  return (
    <PageShell
      title="Payments"
      description="View payment records, update statuses, and manually enroll students."
    >
      <div className="space-y-6">

        {/* ── Stats row ── */}
        {stats ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Total Payments</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {stats.total}
              </p>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Successful</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-700">
                {stats.success}
              </p>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Pending</p>
              <p className="mt-1 text-2xl font-semibold text-amber-700">
                {stats.pending}
              </p>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Failed</p>
              <p className="mt-1 text-2xl font-semibold text-rose-700">
                {stats.failed}
              </p>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Total Revenue</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {stats.totalRevenueFormatted}
              </p>
            </div>
          </div>
        ) : null}

        {/* ── Filter bar ── */}
        <form
          method="GET"
          className="rounded-3xl border bg-white p-5 shadow-sm"
        >
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search student name, email, order ID..."
              className="w-full rounded-xl border px-4 py-3 text-sm"
            />

            <select
              name="status"
              defaultValue={status}
              className="rounded-xl border px-4 py-3 text-sm text-slate-700"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>

            <select
              name="gateway"
              defaultValue={gateway}
              className="rounded-xl border px-4 py-3 text-sm text-slate-700"
            >
              <option value="">All Gateways</option>
              <option value="RAZORPAY">Razorpay</option>
              <option value="MANUAL">Manual</option>
            </select>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Apply
            </button>
          </div>

          {(search || status || gateway) ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500">
                Active filters:
              </span>
              {search ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                  Search: &quot;{search}&quot;
                </span>
              ) : null}
              {status ? (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700 ring-1 ring-amber-200">
                  Status: {status}
                </span>
              ) : null}
              {gateway ? (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700 ring-1 ring-blue-200">
                  Gateway: {gateway}
                </span>
              ) : null}
              <Link
                href="/admin/payments"
                className="ml-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
              >
                Clear all
              </Link>
            </div>
          ) : null}
        </form>

        {/* ── Manual enrollment ── */}
        <div className="rounded-3xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Manual Enrollment
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Grant a student access to a batch without a payment — for free
                batches, offline payments, or scholarships.
              </p>
            </div>
            <ManualEnrollButton />
          </div>
        </div>

        {/* ── Payment list ── */}
        {!paymentsResult.success || !data ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {paymentsResult.message}
          </div>
        ) : data.items.length === 0 ? (
          <div className="rounded-3xl border border-dashed bg-white p-10 text-center">
            <h2 className="text-xl font-semibold text-slate-900">
              No payments found
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {search || status || gateway
                ? "Try different filters."
                : "Payments will appear here once students start enrolling."}
            </p>
          </div>
        ) : (
          <>
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
                    {data.items.map((payment) => (
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
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${gatewayBadgeClass(
                              payment.gateway
                            )}`}
                          >
                            {payment.gateway}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDateTime(payment.paidAt ?? payment.createdAt)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <UpdatePaymentStatusButton
                            paymentId={payment.id}
                            currentStatus={payment.status}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {data.totalPages > 1 ? (
              <div className="flex items-center justify-between rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm">
                <p className="text-slate-600">
                  Page {data.page} of {data.totalPages} — {data.total} payments
                </p>
                <div className="flex gap-3">
                  {currentPage > 1 ? (
                    <Link
                      href={buildPageHref(
                        resolvedSearchParams,
                        currentPage - 1
                      )}
                      className="rounded-xl border px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Previous
                    </Link>
                  ) : (
                    <span className="rounded-xl border px-4 py-2 text-slate-400">
                      Previous
                    </span>
                  )}
                  {currentPage < data.totalPages ? (
                    <Link
                      href={buildPageHref(
                        resolvedSearchParams,
                        currentPage + 1
                      )}
                      className="rounded-xl border px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Next
                    </Link>
                  ) : (
                    <span className="rounded-xl border px-4 py-2 text-slate-400">
                      Next
                    </span>
                  )}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </PageShell>
  );
}