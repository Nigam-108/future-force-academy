"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  paymentId: string;
  currentStatus: string;
};

type ReconcileResult = {
  success: boolean;
  message: string;
  data?: {
    previousStatus: string;
    newStatus: string;
    changed: boolean;
    razorpayOrderStatus: string;
    message: string;
  };
};

export function ReconcilePaymentButton({ paymentId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReconcileResult | null>(null);

  // Only show for PENDING or FAILED Razorpay payments
  if (currentStatus !== "PENDING" && currentStatus !== "FAILED") {
    return null;
  }

  async function handleReconcile() {
    const confirmed = window.confirm(
      "This will check the real payment status with Razorpay and update our records if needed.\n\nProceed?"
    );

    if (!confirmed) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `/api/admin/payments/${paymentId}/reconcile`,
        { method: "POST" }
      );

      const json = (await response.json()) as ReconcileResult;
      setResult(json);

      if (json.data?.changed) {
        router.refresh();
      }
    } catch {
      setResult({
        success: false,
        message: "Network error — reconciliation failed",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => void handleReconcile()}
        disabled={loading}
        className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
      >
        {loading ? "Checking Razorpay..." : "🔄 Sync from Razorpay"}
      </button>

      {result ? (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            result.success && result.data?.changed
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : result.success
              ? "border-blue-200 bg-blue-50 text-blue-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {result.data ? (
            <>
              <p className="font-semibold">
                {result.data.changed ? "✅ Status Updated" : "ℹ️ No Change"}
              </p>
              <p className="mt-1">{result.data.message}</p>
              {result.data.changed ? (
                <p className="mt-1 text-xs">
                  {result.data.previousStatus} → {result.data.newStatus}
                </p>
              ) : (
                <p className="mt-1 text-xs">
                  Razorpay order status: {result.data.razorpayOrderStatus}
                </p>
              )}
            </>
          ) : (
            <p>{result.message}</p>
          )}
        </div>
      ) : null}

      <p className="text-xs text-slate-500">
        Use this when a payment is stuck in PENDING and the webhook may have
        been missed.
      </p>
    </div>
  );
}