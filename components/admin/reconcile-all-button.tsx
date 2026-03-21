"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ReconcileAllResult = {
  success: boolean;
  message: string;
  data?: {
    total: number;
    updated: number;
    failed: number;
    results: Array<{
      paymentId: string;
      changed: boolean;
      newStatus: string;
      message: string;
      error?: string;
    }>;
  };
};

export function ReconcileAllButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReconcileAllResult | null>(null);

  async function handleReconcileAll() {
    const confirmed = window.confirm(
      "This will check ALL stuck pending Razorpay payments against the live Razorpay API and update records automatically.\n\nProceed?"
    );

    if (!confirmed) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/payments/reconcile-all", {
        method: "POST",
      });

      const json = (await response.json()) as ReconcileAllResult;
      setResult(json);

      if (json.data && json.data.updated > 0) {
        router.refresh();
      }
    } catch {
      setResult({
        success: false,
        message: "Network error — bulk reconciliation failed",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => void handleReconcileAll()}
        disabled={loading}
        className="rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-50"
      >
        {loading ? "Syncing with Razorpay..." : "🔄 Sync All Pending"}
      </button>

      {result ? (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            result.success && (result.data?.updated ?? 0) > 0
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : result.success
              ? "border-blue-200 bg-blue-50 text-blue-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {result.data ? (
            <>
              <p className="font-semibold">
                {result.data.updated > 0
                  ? `✅ ${result.data.updated} payment(s) updated`
                  : "ℹ️ No changes needed"}
              </p>
              <p className="mt-1 text-xs">
                Checked: {result.data.total} · Updated: {result.data.updated} ·
                Errors: {result.data.failed}
              </p>
            </>
          ) : (
            <p>{result.message}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}