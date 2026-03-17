"use client";

import { useRouter } from "next/navigation";

/**
 * Simple reusable top action bar for print-friendly admin preview pages.
 *
 * Why this exists:
 * - keeps paper page and answer key page consistent
 * - gives a one-click browser print action
 * - allows easy back navigation
 *
 * Browser print is the fastest way right now to export as PDF.
 */
export function PrintPageActions() {
  const router = useRouter();

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
      <div className="text-sm text-slate-600">
        Use browser print to save this page as PDF.
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Print / Save PDF
        </button>
      </div>
    </div>
  );
}