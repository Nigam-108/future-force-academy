import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";

export const dynamic = "force-dynamic";

type CouponItem = {
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
  createdAt: string;
  totalUsages: number;
  usageRemaining: number | null;
  batch: { id: string; title: string; examType: string } | null;
};

type CouponsResponse = {
  items: CouponItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: {
    total: number;
    active: number;
    inactive: number;
    totalUsages: number;
  };
};

function formatDate(value: string | null) {
  if (!value) return "No expiry";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
    new Date(value)
  );
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;
  return new Date() > new Date(expiresAt);
}

export default async function AdminCouponsPage() {
  const result = await fetchInternalApi<CouponsResponse>("/api/admin/coupons");
  const data = result.data;

  return (
    <PageShell
      title="Coupons"
      description="Create and manage discount coupons for batch purchases."
    >
      <div className="space-y-6">

        {/* Stats */}
        {data?.stats ? (
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Total Coupons</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {data.stats.total}
              </p>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Active</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-700">
                {data.stats.active}
              </p>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Inactive</p>
              <p className="mt-1 text-2xl font-semibold text-slate-500">
                {data.stats.inactive}
              </p>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Total Uses</p>
              <p className="mt-1 text-2xl font-semibold text-blue-700">
                {data.stats.totalUsages}
              </p>
            </div>
          </div>
        ) : null}

        {/* Create button */}
        <div className="flex justify-end">
          <Link
            href="/admin/coupons/new"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Create Coupon
          </Link>
        </div>

        {/* Coupon list */}
        {!result.success || !data ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {result.message}
          </div>
        ) : data.items.length === 0 ? (
          <div className="rounded-3xl border border-dashed bg-white p-10 text-center">
            <h2 className="text-xl font-semibold text-slate-900">
              No coupons yet
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Create your first discount coupon for students.
            </p>
            <Link
              href="/admin/coupons/new"
              className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Create First Coupon
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Code
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Discount
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Batch
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Usage
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Expires
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((coupon) => {
                    const expired = isExpired(coupon.expiresAt);
                    return (
                      <tr key={coupon.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <code className="rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-bold text-slate-900">
                            {coupon.code}
                          </code>
                          {coupon.description ? (
                            <p className="mt-1 text-xs text-slate-500">
                              {coupon.description}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                            {coupon.discountLabel}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">
                          {coupon.batch ? (
                            <div>
                              <p className="font-medium">{coupon.batch.title}</p>
                              <p className="text-xs text-slate-400">
                                {coupon.batch.examType}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400">All batches</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">
                          <p>
                            {coupon.totalUsages} used
                          </p>
                          {coupon.maxUsageLimit != null ? (
                            <p className="text-xs text-slate-400">
                              {coupon.usageRemaining ?? 0} remaining of{" "}
                              {coupon.maxUsageLimit}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-400">
                              Unlimited
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">
                          <p
                            className={
                              expired ? "text-rose-600 font-medium" : ""
                            }
                          >
                            {formatDate(coupon.expiresAt)}
                          </p>
                          {expired ? (
                            <p className="text-xs text-rose-500">Expired</p>
                          ) : null}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                              coupon.isActive && !expired
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                : "bg-slate-100 text-slate-500 ring-slate-200"
                            }`}
                          >
                            {!coupon.isActive
                              ? "Disabled"
                              : expired
                              ? "Expired"
                              : "Active"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/admin/coupons/${coupon.id}`}
                            className="rounded-xl border px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            View / Edit
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}