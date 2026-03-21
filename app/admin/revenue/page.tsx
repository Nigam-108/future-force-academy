import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

type GlobalStats = {
  fullBatch: {
    totalRevenueFormatted: string;
    totalPayments: number;
  };
  individualTests: {
    totalRevenueFormatted: string;
    totalPayments: number;
  };
  totalRevenueFormatted: string;
  topPurchasedTests: Array<{
    testId: string;
    purchaseCount: number;
    test: { id: string; title: string } | null;
  }>;
};

type BatchRevenue = {
  batchId: string;
  batchTitle: string;
  examType: string;
  status: string;
  listedPricePaise: number | null;
  listedPriceFormatted: string | null;
  totalTests: number;
  fullBatch: {
    totalRevenueFormatted: string;
    totalPayments: number;
  };
  individualTests: {
    totalRevenueFormatted: string;
    totalPayments: number;
  };
  totalRevenuePaise: number;
  totalRevenueFormatted: string;
};

type CouponStats = {
  totalCoupons: number;
  activeCoupons: number;
  totalUsages: number;
  totalSavingsFormatted: string;
};

type EnrollmentStats = {
  totalEnrollments: number;
  activeEnrollments: number;
  individualTestPurchases: number;
};

type RevenueResponse = {
  global: GlobalStats;
  batchRevenue: BatchRevenue[];
  coupons: CouponStats;
  enrollments: EnrollmentStats;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function examTypeBadgeClass(examType: string) {
  switch (examType) {
    case "GPSC":
      return "bg-blue-50 text-blue-700";
    case "UPSC":
      return "bg-purple-50 text-purple-700";
    case "WPSI":
      return "bg-orange-50 text-orange-700";
    case "TECHNICAL_OPERATOR":
      return "bg-cyan-50 text-cyan-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "CLOSED":
      return "bg-slate-100 text-slate-600 ring-slate-200";
    default:
      return "bg-amber-50 text-amber-700 ring-amber-200";
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminRevenuePage() {
  const result = await fetchInternalApi<RevenueResponse>(
    "/api/admin/revenue"
  );

  if (!result.success || !result.data) {
    return (
      <PageShell
        title="Revenue"
        description="Platform revenue breakdown across all paid batches."
      >
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {result.message}
        </div>
      </PageShell>
    );
  }

  const { global, batchRevenue, coupons, enrollments } = result.data;

  return (
    <PageShell
      title="Revenue"
      description="Platform revenue breakdown — full batch purchases, individual test sales, and coupon usage."
    >
      <div className="space-y-8">

        {/* ── Top-level action links ── */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/payments"
            className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Payment Records →
          </Link>
          <Link
            href="/admin/coupons"
            className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Manage Coupons →
          </Link>
        </div>

        {/* ── Global revenue hero ── */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border bg-white p-6 shadow-sm xl:col-span-1">
            <p className="text-sm text-slate-500">Total Platform Revenue</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {global.totalRevenueFormatted}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {global.fullBatch.totalPayments +
                global.individualTests.totalPayments}{" "}
              successful payments
            </p>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Full Batch Revenue</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {global.fullBatch.totalRevenueFormatted}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {global.fullBatch.totalPayments} purchase
              {global.fullBatch.totalPayments !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Individual Test Revenue</p>
            <p className="mt-2 text-3xl font-bold text-blue-700">
              {global.individualTests.totalRevenueFormatted}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {global.individualTests.totalPayments} purchase
              {global.individualTests.totalPayments !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Coupon Savings Given</p>
            <p className="mt-2 text-3xl font-bold text-rose-600">
              {coupons.totalSavingsFormatted}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {coupons.totalUsages} coupon
              {coupons.totalUsages !== 1 ? "s" : ""} used
            </p>
          </div>
        </div>

        {/* ── Enrollment stats ── */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Active Batch Enrollments</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {enrollments.activeEnrollments}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {enrollments.totalEnrollments} total enrollments
            </p>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Individual Test Purchases
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {enrollments.individualTestPurchases}
            </p>
            <p className="mt-1 text-xs text-slate-400">active test access records</p>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Active Coupons</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {coupons.activeCoupons}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {coupons.totalCoupons} total coupons created
            </p>
          </div>
        </div>

        {/* ── Top purchased tests globally ── */}
        {global.topPurchasedTests.length > 0 ? (
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Top Purchased Tests (Platform-Wide)
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Most popular individual test purchases across all batches
            </p>
            <div className="mt-4 space-y-3">
              {global.topPurchasedTests.map((item, idx) => (
                <div
                  key={item.testId}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">
                      {idx + 1}
                    </span>
                    <p className="font-medium text-slate-900">
                      {item.test?.title ?? item.testId}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                    {item.purchaseCount} purchase
                    {item.purchaseCount !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* ── Per-batch revenue table ── */}
        {batchRevenue.length === 0 ? (
          <div className="rounded-3xl border border-dashed bg-white p-10 text-center">
            <h2 className="text-xl font-semibold text-slate-900">
              No paid batches yet
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Revenue will appear here once you create paid batches and
              students start purchasing.
            </p>
            <Link
              href="/admin/batches/new"
              className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Create a Batch
            </Link>
          </div>
        ) : (
          <div className="rounded-3xl border bg-white shadow-sm">
            <div className="border-b px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Revenue by Batch
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Sorted by total revenue. Click a batch to manage its pricing.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Batch
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Listed Price
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Full Batch
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Ind. Tests
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Total Revenue
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50">
                  {batchRevenue.map((batch) => (
                    <tr key={batch.batchId} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${examTypeBadgeClass(
                              batch.examType
                            )}`}
                          >
                            {batch.examType}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {batch.batchTitle}
                            </p>
                            <p className="text-xs text-slate-400">
                              {batch.totalTests} test
                              {batch.totalTests !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(
                            batch.status
                          )}`}
                        >
                          {batch.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {batch.listedPriceFormatted ?? (
                          <span className="text-slate-400">Not set</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <p className="font-semibold text-emerald-700">
                          {batch.fullBatch.totalRevenueFormatted}
                        </p>
                        <p className="text-xs text-slate-400">
                          {batch.fullBatch.totalPayments} purchase
                          {batch.fullBatch.totalPayments !== 1 ? "s" : ""}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <p className="font-semibold text-blue-700">
                          {batch.individualTests.totalRevenueFormatted}
                        </p>
                        <p className="text-xs text-slate-400">
                          {batch.individualTests.totalPayments} purchase
                          {batch.individualTests.totalPayments !== 1 ? "s" : ""}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <p className="text-lg font-bold text-slate-900">
                          {batch.totalRevenueFormatted}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/batches/${batch.batchId}/pricing`}
                          className="rounded-xl border px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Pricing →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Totals row */}
                <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-4 text-sm font-bold text-slate-700"
                    >
                      Platform Total ({batchRevenue.length} paid batch
                      {batchRevenue.length !== 1 ? "es" : ""})
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-bold text-emerald-700">
                      {global.fullBatch.totalRevenueFormatted}
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-bold text-blue-700">
                      {global.individualTests.totalRevenueFormatted}
                    </td>
                    <td className="px-5 py-4 text-right text-lg font-bold text-slate-900">
                      {global.totalRevenueFormatted}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ── Coupon breakdown ── */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Coupons Created</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {coupons.totalCoupons}
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Active Coupons</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-700">
              {coupons.activeCoupons}
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Coupon Uses</p>
            <p className="mt-1 text-2xl font-semibold text-blue-700">
              {coupons.totalUsages}
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Discounts Given
            </p>
            <p className="mt-1 text-2xl font-semibold text-rose-600">
              {coupons.totalSavingsFormatted}
            </p>
          </div>
        </div>

      </div>
    </PageShell>
  );
}