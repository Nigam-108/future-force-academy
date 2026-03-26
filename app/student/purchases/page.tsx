import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";
import { BuyFullBatchButton } from "@/components/student/buy-full-batch-button";
import { BuySelectedTestsModal } from "@/components/student/buy-selected-tests-modal";

export const dynamic = "force-dynamic";

type PurchaseStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";

type LinkedTest = {
  id: string;
  title: string;
  slug: string;
  mode: string;
  visibilityStatus: string;
  totalQuestions: number;
  totalMarks: number;
  durationInMinutes: number | null;
  structureType: string;
};

type PurchaseItem = {
  id: string;
  status: PurchaseStatus;
  isActive: boolean;
  isExpired: boolean;
  validFrom: string;
  validUntil: string | null;
  createdAt: string;
  totalLinkedTests: number;
  linkedTests: LinkedTest[];
  batch: {
    id: string;
    title: string;
    slug: string;
    examType: string;
    isPaid: boolean;
    status: string;
    color: string;
  };
  payment: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    gateway: string;
    paidAt: string | null;
  } | null;
};

type AvailableBatch = {
  id: string;
  title: string;
  slug: string;
  examType: string;
  description: string | null;
  isPaid: boolean;
  price: number | null;
  originalPrice: number | null;
  offerEndDate: string | null;
  priceFormatted: string | null;
  originalPriceFormatted: string | null;
  discountPercent: number | null;
  totalTests: number;
  paidTestCount: number;
  totalIndividualPricePaise: number;
  totalIndividualPriceFormatted: string | null;
  liveTests: Array<{
    testId: string;
    title: string;
    mode: string;
    totalQuestions: number;
    totalMarks: number;
    durationInMinutes: number | null;
    price: number;
    priceFormatted: string;
    isFree: boolean;
    alreadyPurchased: boolean;
  }>;
};

function formatDate(value: string | null) {
  if (!value) return "No expiry";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function statusBadgeClass(isActive: boolean, isExpired: boolean) {
  if (isExpired) return "bg-rose-50 text-rose-700 ring-rose-200";
  if (isActive) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function statusLabel(status: PurchaseStatus, isExpired: boolean): string {
  if (isExpired) return "Expired";
  if (status === "ACTIVE") return "Active";
  if (status === "CANCELLED") return "Cancelled";
  return status;
}

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

function formatAmount(amount: number, gateway: string) {
  if (gateway === "MANUAL" && amount === 0) return "Admin Enrollment";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount / 100);
}

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = (await searchParams) ?? {};
  const paymentSuccess = resolvedParams.payment === "success";

  const [purchaseResult, availableResult] = await Promise.all([
    fetchInternalApi<PurchaseItem[]>("/api/student/purchases"),
    fetchInternalApi<AvailableBatch[]>("/api/student/batches/available"),
  ]);

  const purchases = purchaseResult.data ?? [];
  const availableBatches = availableResult.data ?? [];

  const activePurchases = purchases.filter((p) => p.isActive && !p.isExpired);
  const inactivePurchases = purchases.filter((p) => !p.isActive || p.isExpired);

  return (
    <PageShell
      title="My Enrollments"
      description="Track your batch access, expiry, and available batches."
    >
      {paymentSuccess ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="font-semibold text-emerald-800">
            Payment successful! Your access has been activated.
          </p>
          <p className="mt-1 text-sm text-emerald-700">
            Your enrollment is now active. Start your tests below.
          </p>
        </div>
      ) : null}

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Enrollments</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {purchases.length}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active Access</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {activePurchases.length}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Tests Available</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {activePurchases.reduce((sum, p) => sum + p.linkedTests.length, 0)}
          </p>
        </div>
      </div>

      {availableBatches.length > 0 ? (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900">Available Batches</h2>
          <p className="mt-2 text-sm text-slate-600">
            Paid and free batches available for enrollment are shown here.
          </p>

          <div className="mt-6 grid gap-6">
            {availableBatches.map((batch) => (
              <div
                key={batch.id}
                className="rounded-3xl border bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${examTypeBadgeClass(
                      batch.examType
                    )}`}
                  >
                    {batch.examType}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      batch.isPaid
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {batch.isPaid ? "Paid Batch" : "Free Batch"}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {batch.totalTests} tests
                  </span>
                </div>

                <h3 className="mt-4 text-xl font-bold text-slate-900">
                  {batch.title}
                </h3>

                {batch.description ? (
                  <p className="mt-2 text-sm text-slate-600">{batch.description}</p>
                ) : null}

                {batch.isPaid ? (
                  batch.price != null ? (
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <span className="text-2xl font-bold text-slate-900">
                        {batch.priceFormatted}
                      </span>

                      {batch.originalPriceFormatted ? (
                        <span className="text-sm text-slate-400 line-through">
                          {batch.originalPriceFormatted}
                        </span>
                      ) : null}

                      {batch.discountPercent != null ? (
                        <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
                          {batch.discountPercent}% OFF
                        </span>
                      ) : null}

                      {batch.offerEndDate ? (
                        <span className="text-sm text-amber-700">
                          ⏰ Offer ends {formatDate(batch.offerEndDate)}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      ⚠️ Pricing not set for this batch yet. Contact admin.
                    </div>
                  )
                ) : (
                  <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                    Free batch — no payment required.
                  </div>
                )}

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <h4 className="font-semibold text-slate-900">
                      Full Batch Access
                    </h4>
                    <p className="mt-2 text-sm text-slate-600">
                      {batch.isPaid
                        ? `Access all ${batch.totalTests} tests including future ones added to this batch.`
                        : `This free batch is visible to students now. You can enroll it without payment flow once free self-enrollment is added, or admin can manually enroll students.`}
                    </p>

                                        <div className="mt-4">
                      {batch.isPaid && batch.price != null ? (
                        <BuyFullBatchButton
                          batchId={batch.id}
                          batchTitle={batch.title}
                          price={batch.price}
                          originalPrice={batch.originalPrice}
                          discountPercent={batch.discountPercent}
                          offerEndDate={batch.offerEndDate}
                          priceFormatted={batch.priceFormatted ?? "₹0"}
                          originalPriceFormatted={batch.originalPriceFormatted}
                        />
                      ) : (
                        <div className="space-y-3">
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                            Visible as a free batch.
                          </div>

                          <Link
                            href={`/student/tests?batchId=${batch.id}`}
                            className="inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            View Free Batch Tests →
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <h4 className="font-semibold text-slate-900">
                      Buy Individual Tests
                    </h4>

                    {batch.isPaid ? (
                      <>
                        <p className="mt-2 text-sm text-slate-600">
                          Pick specific tests. No access to future tests.
                        </p>

                        {batch.totalIndividualPriceFormatted ? (
                          <p className="mt-3 text-sm text-slate-700">
                            All tests:{" "}
                            <span className="font-semibold">
                              {batch.totalIndividualPriceFormatted}
                            </span>{" "}
                            (no coupon, no future tests)
                          </p>
                        ) : null}

                        <div className="mt-4">
                          {batch.paidTestCount > 0 ? (
                            <BuySelectedTestsModal
                              batchId={batch.id}
                              batchTitle={batch.title}
                              tests={batch.liveTests}
                            />
                          ) : (
                            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                              No individual tests priced yet for this batch.
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        Individual paid test purchase is not needed for a free batch.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {!purchaseResult.success ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {purchaseResult.message}
        </div>
      ) : purchases.length === 0 && availableBatches.length === 0 ? (
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">No enrollments yet</h2>
          <p className="mt-2 text-sm text-slate-600">
            You have not been enrolled in any batches yet.
          </p>
          <Link
            href="/student/tests"
            className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Browse Available Tests
          </Link>
        </div>
      ) : (
        <>
          {activePurchases.length > 0 ? (
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-slate-900">
                Active Enrollments
              </h2>

              <div className="mt-6 grid gap-6">
                {activePurchases.map((purchase) => {
                  const batchColor = purchase.batch.color ?? "#6366f1";

                  return (
                    <div
                      key={purchase.id}
                      className="rounded-3xl border bg-white p-6 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: batchColor }}
                        />
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${examTypeBadgeClass(
                            purchase.batch.examType
                          )}`}
                        >
                          {purchase.batch.examType}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(
                            purchase.isActive,
                            purchase.isExpired
                          )}`}
                        >
                          {statusLabel(purchase.status, purchase.isExpired)}
                        </span>
                        {purchase.payment ? (
                          <span className="text-sm font-medium text-slate-600">
                            {formatAmount(
                              purchase.payment.amount,
                              purchase.payment.gateway
                            )}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-4 flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">
                            {purchase.batch.title}
                          </h3>
                        </div>

                        <Link
                          href={`/student/tests?batch=${purchase.batch.id}`}
                          className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Go to Tests →
                        </Link>
                      </div>

                      <div className="mt-6 grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            Enrolled Since
                          </p>
                          <p className="mt-2 font-semibold text-slate-900">
                            {formatDate(purchase.validFrom)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            Valid Until
                          </p>
                          <p className="mt-2 font-semibold text-slate-900">
                            {formatDate(purchase.validUntil)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            Tests Available
                          </p>
                          <p className="mt-2 font-semibold text-slate-900">
                            {purchase.totalLinkedTests} total
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {inactivePurchases.length > 0 ? (
            <section>
              <h2 className="text-2xl font-bold text-slate-900">
                Past Enrollments
              </h2>

              <div className="mt-6 grid gap-4">
                {inactivePurchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="rounded-2xl border bg-white p-5 shadow-sm"
                  >
                    <h3 className="text-lg font-semibold text-slate-900">
                      {purchase.batch.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {purchase.batch.examType} · {formatDate(purchase.validFrom)} —{" "}
                      {formatDate(purchase.validUntil)}
                    </p>
                    <div className="mt-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(
                          purchase.isActive,
                          purchase.isExpired
                        )}`}
                      >
                        {statusLabel(purchase.status, purchase.isExpired)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </PageShell>
  );
}