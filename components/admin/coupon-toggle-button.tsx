"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  couponId: string;
  isActive: boolean;
};

type ApiResponse = { success: boolean; message: string };

export function CouponToggleButton({ couponId, isActive }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState(isActive);

  async function handleToggle() {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      const json = (await response.json()) as ApiResponse;
      if (!response.ok || !json.success) throw new Error(json.message);
      setCurrent((prev) => !prev);
      router.refresh();
    } catch {
      // silent
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleToggle()}
      disabled={busy}
      className={`rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
        current
          ? "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
          : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      }`}
    >
      {busy ? "..." : current ? "Disable Coupon" : "Enable Coupon"}
    </button>
  );
}