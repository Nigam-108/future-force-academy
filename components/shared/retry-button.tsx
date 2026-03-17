"use client";

/**
 * Tiny reusable retry button.
 *
 * Why this exists:
 * - used where a full page refresh is the simplest safe recovery
 * - avoids repeated inline button code
 */
export function RetryButton({
  label = "Retry",
}: {
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      {label}
    </button>
  );
}