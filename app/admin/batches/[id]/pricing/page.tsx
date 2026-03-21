import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";
import { BatchPricingForm } from "@/components/admin/batch-pricing-form";
import { TestPricesTable } from "@/components/admin/test-prices-table";

type PageProps = {
  params: Promise<{ id: string }>;
};

type BatchPricingResponse = {
  batchId: string;
  batchTitle: string;
  isPaid: boolean;
  price: number | null;
  originalPrice: number | null;
  offerEndDate: string | null;
  priceFormatted: string | null;
  originalPriceFormatted: string | null;
  discountPercent: number | null;
  tests: Array<{
    testBatchId: string;
    testId: string;
    price: number | null;
    priceFormatted: string;
    isFree: boolean;
    test: {
      id: string;
      title: string;
      slug: string;
      mode: string;
      visibilityStatus: string;
      totalQuestions: number;
      totalMarks: number;
      durationInMinutes: number | null;
    };
  }>;
};

type PricingStatsResponse = {
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

export default async function BatchPricingPage({ params }: PageProps) {
  const { id } = await params;

  const [pricingResult, statsResult] = await Promise.all([
    fetchInternalApi<BatchPricingResponse>(
      `/api/admin/batches/${id}/pricing`
    ),
    fetchInternalApi<PricingStatsResponse>(
      `/api/admin/pricing/stats?batchId=${id}`
    ),
  ]);

  if (!pricingResult.success && pricingResult.status === 404) {
    notFound();
  }

  if (!pricingResult.success || !pricingResult.data) {
    return (
      <PageShell
        title="Batch Pricing"
        description="Set prices for this batch and individual tests."
      >
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {pricingResult.message}
        </div>
      </PageShell>
    );
  }

  const pricing = pricingResult.data;
  const stats = statsResult.data;

  return (
    <PageShell
      title="Batch Pricing"
      description={`Set prices for "${pricing.batchTitle}" and individual tests within it.`}
    >
      {/* Navigation */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/admin/batches"
          className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ← Back to Batches
        </Link>
        <Link
          href={`/admin/tests?batchId=${id}`}
          className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          View Tests in Batch
        </Link>
        <Link
          href="/admin/coupons"
          className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Manage Coupons
        </Link>
      </div>

      {/* Revenue stats for this batch */}
      {stats ? (
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Full Batch Revenue</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {stats.fullBatch.totalRevenueFormatted}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {stats.fullBatch.totalPayments} purchase
              {stats.fullBatch.totalPayments !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Individual Test Revenue</p>
            <p className="mt-1 text-2xl font-bold text-blue-700">
              {stats.individualTests.totalRevenueFormatted}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {stats.individualTests.totalPayments} purchase
              {stats.individualTests.totalPayments !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Revenue</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">
              {stats.totalRevenueFormatted}
            </p>
          </div>
        </div>
      ) : null}

      <div className="space-y-8">
        {/* Batch pricing section */}
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Full Batch Pricing
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Set the price a student pays to access all tests in this batch.
              Prices are in ₹ (rupees). Leave blank for free access.
            </p>
          </div>

          {!pricing.isPaid ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              ⚠️ This batch is marked as <strong>Free</strong>. To enable
              pricing, edit the batch and set it as a paid batch first.
            </div>
          ) : (
            <BatchPricingForm
              batchId={pricing.batchId}
              initialPrice={pricing.price}
              initialOriginalPrice={pricing.originalPrice}
              initialOfferEndDate={pricing.offerEndDate}
              priceFormatted={pricing.priceFormatted}
              originalPriceFormatted={pricing.originalPriceFormatted}
              discountPercent={pricing.discountPercent}
            />
          )}
        </div>

        {/* Per-test pricing section */}
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Individual Test Prices
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Set prices for individual tests so students can purchase specific
              tests instead of the full batch. Leave blank to make a test free
              within this batch.
            </p>
          </div>

          {pricing.tests.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">
              No tests are linked to this batch yet.{" "}
              <Link
                href={`/admin/tests?batchId=${id}`}
                className="font-medium text-blue-600 hover:underline"
              >
                Assign tests to this batch first
              </Link>
              .
            </div>
          ) : (
            <TestPricesTable batchId={pricing.batchId} tests={pricing.tests} />
          )}
        </div>

        {/* Top purchased tests */}
        {stats && stats.topPurchasedTests.length > 0 ? (
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Most Purchased Tests
            </h2>
            <div className="mt-4 space-y-3">
              {stats.topPurchasedTests.map((item, idx) => (
                <div
                  key={item.testId}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                      {idx + 1}
                    </span>
                    <p className="text-sm font-medium text-slate-900">
                      {item.test?.title ?? item.testId}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {item.purchaseCount} purchase
                    {item.purchaseCount !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}