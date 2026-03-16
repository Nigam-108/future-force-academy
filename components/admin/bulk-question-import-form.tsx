"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Generic API response shape used by this page.
 */
type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
  errors?: unknown;
};

type ImportResponse = {
  totalImported: number;
  items: Array<{
    id: string;
    questionText: string;
  }>;
};

/**
 * Default example content shown to help admin quickly understand the format.
 */
const SAMPLE_TEMPLATE = `Question: What is the capital of India?
A: Mumbai
B: Delhi
C: Kolkata
D: Chennai
Answer: B
Explanation: Delhi is the capital of India.
---
Question: Which planet is known as the Red Planet?
A: Venus
B: Mercury
C: Mars
D: Jupiter
Answer: C
Explanation: Mars is called the Red Planet due to iron oxide on its surface.`;

/**
 * Bulk import UI for paste-based fast question creation.
 *
 * Why textarea instead of CSV first:
 * - fastest to build
 * - easiest to debug
 * - easiest for you to generate/import using AI-created content
 */
export function BulkQuestionImportForm() {
  const router = useRouter();

  const [rawText, setRawText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setImportedCount(null);

    try {
      const response = await fetch("/api/admin/questions/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          rawText: rawText.trim(),
        }),
      });

      const json = (await response.json().catch(() => null)) as
        | ApiResponse<ImportResponse>
        | null;

      if (!response.ok || !json?.success || !json.data) {
        throw new Error(json?.message || "Failed to import questions.");
      }

      setImportedCount(json.data.totalImported);
      setSuccessMessage(
        `${json.data.totalImported} question(s) imported successfully.`
      );
      setRawText("");

      /**
       * Refresh helps question bank/list pages reflect latest imported data
       * if user navigates immediately after import.
       */
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to import questions."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
        <p className="font-semibold">Paste Import Format</p>
        <div className="mt-2 space-y-1">
          <p>1. Use one question block in this format:</p>
          <p className="font-mono text-xs">
            Question / A / B / C / D / Answer / Explanation
          </p>
          <p>2. Separate each question block with:</p>
          <p className="font-mono text-xs">---</p>
          <p>3. Answer must be only A, B, C or D.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800">
            Paste MCQs here
          </label>
          <textarea
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            className="min-h-[420px] w-full rounded-2xl border px-4 py-3 font-mono text-sm"
            placeholder="Paste many question blocks here..."
            required
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {submitting ? "Importing..." : "Import Questions"}
          </button>

          <button
            type="button"
            onClick={() => setRawText(SAMPLE_TEMPLATE)}
            className="rounded-xl border px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Fill Sample Template
          </button>

          <button
            type="button"
            onClick={() => setRawText("")}
            className="rounded-xl border px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => router.push("/admin/questions")}
            className="rounded-xl border px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Back to Question Bank
          </button>
        </div>
      </form>

      {importedCount !== null ? (
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Last Import Count</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {importedCount}
          </p>
        </div>
      ) : null}
    </div>
  );
}