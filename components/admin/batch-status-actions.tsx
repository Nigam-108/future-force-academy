"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { safeJson } from "@/lib/safe-fetch";

type BatchStatus = "DRAFT" | "ACTIVE" | "CLOSED";

type Props = {
  batchId: string;
  currentStatus: BatchStatus;
  studentCount: number;
};

type ApiResponse = {
  success: boolean;
  message: string;
};

function getTransitions(
  currentStatus: BatchStatus
): Array<{ nextStatus: BatchStatus; label: string; style: string }> {
  switch (currentStatus) {
    case "DRAFT":
      return [
        {
          nextStatus: "ACTIVE",
          label: "Activate Batch",
          style:
            "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
        },
      ];
    case "ACTIVE":
      return [
        {
          nextStatus: "CLOSED",
          label: "Close Batch",
          style:
            "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100",
        },
      ];
    case "CLOSED":
      return [
        {
          nextStatus: "ACTIVE",
          label: "Reopen Batch",
          style:
            "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
        },
      ];
  }
}

export function BatchStatusActions({
  batchId,
  currentStatus,
  studentCount,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const transitions = getTransitions(currentStatus);

  async function handleStatusChange(nextStatus: BatchStatus) {
    if (nextStatus === "CLOSED" && studentCount > 0) {
      const confirmed = window.confirm(
        `Close this batch?\n\n${studentCount} student(s) are enrolled. They will no longer be able to start new attempts on restricted tests.\n\nExisting in-progress attempts will not be affected.`
      );
      if (!confirmed) return;
    }

    if (nextStatus === "ACTIVE" && currentStatus === "CLOSED") {
      const confirmed = window.confirm(
        `Reopen this batch as ACTIVE?\n\nStudents will be able to start attempts again on linked tests.`
      );
      if (!confirmed) return;
    }

    setBusy(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/admin/batches/${batchId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      const json = await safeJson<ApiResponse>(response);

      if (!json.success) {
        throw new Error(json.message);
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update status"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {transitions.map((t) => (
        <button
          key={t.nextStatus}
          type="button"
          onClick={() => void handleStatusChange(t.nextStatus)}
          disabled={busy}
          className={`rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${t.style}`}
        >
          {busy ? "Updating..." : t.label}
        </button>
      ))}

      {errorMessage ? (
        <p className="text-xs text-rose-600">{errorMessage}</p>
      ) : null}
    </div>
  );
}