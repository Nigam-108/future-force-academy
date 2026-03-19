"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  batchId: string;
  batchTitle: string;
  studentCount: number;
  testLinkCount?: number;
};

type ApiResponse = {
  success: boolean;
  message: string;
};

export function DeleteBatchButton({
  batchId,
  batchTitle,
  studentCount,
  testLinkCount = 0,
}: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDelete() {
    const warnings: string[] = [];

    if (studentCount > 0) {
      warnings.push(`${studentCount} student(s) are enrolled`);
    }
    if (testLinkCount > 0) {
      warnings.push(`${testLinkCount} test(s) are linked`);
    }

    const warningText =
      warnings.length > 0
        ? `\n\nWarning: ${warnings.join(" and ")}. The server will block deletion if these exist.`
        : "";

    const confirmed = window.confirm(
      `Permanently delete batch?\n\n"${batchTitle}"${warningText}\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/batches/${batchId}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });

      const json = (await response.json().catch(() => null)) as ApiResponse | null;

      if (!response.ok || !json?.success) {
        throw new Error(json?.message || "Failed to delete batch.");
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete batch."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => void handleDelete()}
        disabled={deleting}
        className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {deleting ? "Deleting..." : "Delete Batch"}
      </button>

      {errorMessage ? (
        <p className="max-w-xs text-xs text-rose-600">{errorMessage}</p>
      ) : null}
    </div>
  );
}