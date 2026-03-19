"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

type Props = {
  paymentId: string;
  currentStatus: PaymentStatus;
};

type ApiResponse = {
  success: boolean;
  message: string;
};

export function UpdatePaymentStatusButton({ paymentId, currentStatus }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleUpdate(nextStatus: PaymentStatus) {
    const confirmed = window.confirm(
      `Change payment status to ${nextStatus}?\n\nThis will ${
        nextStatus === "SUCCESS"
          ? "automatically create or reactivate the student's batch access."
          : nextStatus === "FAILED" || nextStatus === "REFUNDED"
          ? "cancel the student's batch access if it was granted."
          : "update the record only."
      }`
    );

    if (!confirmed) return;

    setBusy(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const json = (await response.json()) as ApiResponse;

      if (!response.ok || !json.success) {
        throw new Error(json.message || "Failed to update payment status.");
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update."
      );
    } finally {
      setBusy(false);
    }
  }

  const options: PaymentStatus[] = ["PENDING", "SUCCESS", "FAILED", "REFUNDED"];
  const nextOptions = options.filter((s) => s !== currentStatus);

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        disabled={busy}
        onChange={(e) => void handleUpdate(e.target.value as PaymentStatus)}
        value=""
        className="rounded-xl border px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        <option value="" disabled>
          {busy ? "Updating..." : "Change status"}
        </option>
        {nextOptions.map((s) => (
          <option key={s} value={s}>
            → {s}
          </option>
        ))}
      </select>
      {errorMessage ? (
        <p className="max-w-xs text-xs text-rose-600">{errorMessage}</p>
      ) : null}
    </div>
  );
}