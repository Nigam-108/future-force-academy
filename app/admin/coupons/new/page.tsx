import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";
import { CouponForm } from "@/components/admin/coupon-form";

type BatchOption = {
  id: string;
  title: string;
  examType: string;
  status: string;
};

export default async function NewCouponPage() {
  const batchResult = await fetchInternalApi<BatchOption[]>(
    "/api/admin/batches/options"
  );

  const batchOptions = batchResult.data ?? [];

  return (
    <PageShell
      title="Create Coupon"
      description="Create a new discount coupon for student purchases."
    >
      <div className="mb-6">
        <Link
          href="/admin/coupons"
          className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ← Back to Coupons
        </Link>
      </div>

      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <CouponForm
          mode="create"
          batchOptions={batchOptions.filter((b) => b.status === "ACTIVE")}
          redirectOnSuccess="/admin/coupons"
        />
      </div>
    </PageShell>
  );
}