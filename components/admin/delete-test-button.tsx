"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  testId: string;
  title: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
};

export function DeleteTestButton({ testId, title }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete this test?\n\n${title}\n\nThis should only be used for tests without student attempts.`
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/tests/${testId}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      });

      const json = (await response.json().catch(() => null)) as
        | ApiResponse
        | null;

      if (!response.ok || !json?.success) {
        throw new Error(json?.message || "Failed to delete test.");
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete test."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void handleDelete()}
        disabled={deleting}
        className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {deleting ? "Deleting..." : "Delete"}
      </button>

      {errorMessage ? (
        <p className="max-w-xs text-xs text-rose-600">{errorMessage}</p>
      ) : null}
    </div>
  );
}