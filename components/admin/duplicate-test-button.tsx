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

/**
 * Button used on admin tests page to duplicate a test quickly.
 */
export function DuplicateTestButton({ testId, title }: Props) {
  const router = useRouter();
  const [duplicating, setDuplicating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDuplicate() {
    const confirmed = window.confirm(
      `Create a duplicate copy of this test?\n\n${title}\n\nThe new copy will be created as DRAFT.`
    );

    if (!confirmed) {
      return;
    }

    setDuplicating(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/tests/${testId}/duplicate`, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      });

      const json = (await response.json().catch(() => null)) as
        | ApiResponse
        | null;

      if (!response.ok || !json?.success) {
        throw new Error(json?.message || "Failed to duplicate test.");
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to duplicate test."
      );
    } finally {
      setDuplicating(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void handleDuplicate()}
        disabled={duplicating}
        className="rounded-xl border border-sky-200 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {duplicating ? "Duplicating..." : "Duplicate"}
      </button>

      {errorMessage ? (
        <p className="max-w-xs text-xs text-rose-600">{errorMessage}</p>
      ) : null}
    </div>
  );
}