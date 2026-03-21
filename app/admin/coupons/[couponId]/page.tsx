import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";
import { CouponForm } from "@/components/admin/coupon-form";
import { CouponToggleButton } from "@/components/admin/coupon-toggle-button";

type PageProps = {
  params: Promise<{ couponId: string }>;
};

type CouponDetail = {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  discountLabel: string;
  maxUsageLimit: number | null;
  perStudentLimit: number;
  batchId: string | null;
  expiresAt: string | null;
  isActive: boolean;
  totalUsages: number;
  batch: { id: string; title: string; examType: string } | null;
  usages: Array<{
    id: string;
    discountApplied: number;
    createdAt: string;
    user: {
      id: string;
      fullName: string;
      email: string;
    };
    payment: {
      id: string;
      amount: number;
      discountAmount: number;
      originalAmount: number | null;
      status: string;
      createdAt: string;
    };
  }>;
};

type BatchOption = {
  id: string;
  title: string;
  examType: string;
  status: string;
};

function formatAmount(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(paise / 100);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function CouponDetailPage({ params }: PageProps) {
  const { couponId } = await params;

  const [couponResult, batchResult] = await Promise.all([
    fetchInternalApi<CouponDetail>(`/api/admin/coupons/${couponId}`),
    fetchInternalApi<BatchOption[]>("/api/admin/batches/options"),
  ]);

  if (!couponResult.success && couponResult.status === 404) {
    notFound();
  }

  if (!couponResult.success || !couponResult.data) {
    return (
      <PageShell title="Coupon Detail" description="">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {couponResult.message}
        </div>
      </PageShell>
    );
  }

  const coupon = couponResult.data;
  const batchOptions = (batchResult.data ?? []).filter(
    (b) => b.status === "ACTIVE"
  );

  return (
    <PageShell
      title={`Coupon: ${coupon.code}`}
      description="View usage, edit details, and toggle this coupon."
    >
      {/* Nav */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/admin/coupons"
          className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ← Back to Coupons
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Left — edit form */}
        <div className="space-y-6">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <code className="rounded-lg bg-slate-100 px-3 py-1.5 text-lg font-bold text-slate-900">
                  {coupon.code}
                </code>
                <p className="mt-2 text-sm text-slate-500">
                  {coupon.discountLabel} ·{" "}
                  {coupon.totalUsages} use
                  {coupon.totalUsages !== 1 ? "s" : ""}
                </p>
              </div>
              <CouponToggleButton
                couponId={coupon.id}
                isActive={coupon.isActive}
              />
            </div>

            <CouponForm
              mode="edit"
              couponId={coupon.id}
              initialValues={{
                description: coupon.description ?? "",
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                maxUsageLimit: coupon.maxUsageLimit ?? undefined,
                perStudentLimit: coupon.perStudentLimit,
                batchId: coupon.batchId ?? "",
                expiresAt: coupon.expiresAt
                  ? new Date(coupon.expiresAt).toISOString().slice(0, 10)
                  : "",
                isActive: coupon.isActive,
              }}
              batchOptions={batchOptions}
              redirectOnSuccess="/admin/coupons"
            />
          </div>
        </div>

        {/* Right — usage history */}
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Usage History
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {coupon.totalUsages} student
            {coupon.totalUsages !== 1 ? "s" : ""} used this coupon
          </p>

          {coupon.usages.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">
              No one has used this coupon yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {coupon.usages.map((usage) => (
                <div
                  key={usage.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {usage.user.fullName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {usage.user.email}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                      -{formatAmount(usage.discountApplied)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                    {usage.payment.originalAmount != null ? (
                      <>
                        <span className="line-through">
                          {formatAmount(usage.payment.originalAmount)}
                        </span>
                        <span>→</span>
                        <span className="font-medium text-slate-700">
                          {formatAmount(usage.payment.amount)}
                        </span>
                      </>
                    ) : (
                      <span className="font-medium text-slate-700">
                        {formatAmount(usage.payment.amount)} paid
                      </span>
                    )}
                    <span>·</span>
                    <span>{formatDateTime(usage.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}