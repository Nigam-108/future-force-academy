"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ExamType = "UPSC" | "GPSC" | "WPSI" | "TECHNICAL_OPERATOR" | "OTHER";
type BatchStatus = "DRAFT" | "ACTIVE" | "CLOSED";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
  errors?: unknown;
};

export type BatchFormInitialValues = {
  title: string;
  slug: string;
  description: string | null;
  examType: ExamType;
  status: BatchStatus;
  startDate: string | null;
  endDate: string | null;
  isPaid: boolean;
  color?: string;
};

type BatchFormProps = {
  mode?: "create" | "edit";
  batchId?: string;
  initialValues?: BatchFormInitialValues;
};

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toDateInput(value: string | null | undefined) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

/**
 * Admin batch form.
 *
 * Goal:
 * - minimal but scalable
 * - supports exam tagging and paid/free structure
 */
export function BatchForm({
  mode = "create",
  batchId,
  initialValues,
}: BatchFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [slug, setSlug] = useState(initialValues?.slug ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [examType, setExamType] = useState<ExamType>(
    initialValues?.examType ?? "OTHER"
  );
  const [status, setStatus] = useState<BatchStatus>(
    initialValues?.status ?? "DRAFT"
  );
  const [startDate, setStartDate] = useState(toDateInput(initialValues?.startDate));
  const [endDate, setEndDate] = useState(toDateInput(initialValues?.endDate));
   const [isPaid, setIsPaid] = useState(initialValues?.isPaid ?? false);
  const [color, setColor] = useState(
    initialValues?.color ?? "#6366f1"
  );
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValues?.slug));
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const computedSlug = useMemo(() => {
    if (slugTouched) return slug;
    return makeSlug(title);
  }, [title, slug, slugTouched]);

  function resetCreateForm() {
    setTitle("");
    setSlug("");
    setDescription("");
    setExamType("OTHER");
    setStatus("DRAFT");
    setStartDate("");
    setEndDate("");
     setIsPaid(false);
    setColor("#6366f1");
    setSlugTouched(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = {
        title: title.trim(),
        slug: computedSlug.trim(),
        description: description.trim() || undefined,
        examType,
        status,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        isPaid,
        color,
      };

      const url =
        mode === "edit" && batchId
          ? `/api/admin/batches/${batchId}`
          : "/api/admin/batches";

      const method = mode === "edit" ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = (await response.json().catch(() => null)) as ApiResponse<{
        id: string;
      }> | null;

      if (!response.ok || !json?.success) {
        throw new Error(json?.message || "Failed to save batch.");
      }

      if (mode === "create") {
        setSuccessMessage("Batch created successfully.");
        resetCreateForm();
        router.refresh();
        return;
      }

      router.push("/admin/batches");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save batch."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-slate-800">Batch Title</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-2xl border px-4 py-3"
            placeholder="Enter batch title"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-slate-800">Slug</label>
          <input
            value={computedSlug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            className="w-full rounded-2xl border px-4 py-3"
            placeholder="batch-slug"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-slate-800">
            Description
          </label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-28 w-full rounded-2xl border px-4 py-3"
            placeholder="Optional batch description"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800">Exam Type</label>
          <select
            value={examType}
            onChange={(event) => setExamType(event.target.value as ExamType)}
            className="w-full rounded-2xl border px-4 py-3"
          >
            <option value="UPSC">UPSC</option>
            <option value="GPSC">GPSC</option>
            <option value="WPSI">WPSI</option>
            <option value="TECHNICAL_OPERATOR">Technical Operator</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800">Status</label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as BatchStatus)}
            className="w-full rounded-2xl border px-4 py-3"
          >
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="w-full rounded-2xl border px-4 py-3"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="w-full rounded-2xl border px-4 py-3"
          />
        </div>

         <label className="flex items-center gap-3 rounded-2xl border px-4 py-3 md:col-span-2">
          <input
            type="checkbox"
            checked={isPaid}
            onChange={(event) => setIsPaid(event.target.checked)}
          />
          <span className="text-sm font-medium text-slate-700">
            This is a paid batch
          </span>
        </label>

        {/* ── Batch Color Picker ── */}
        <div className="space-y-3 md:col-span-2">
          <label className="text-sm font-semibold text-slate-800">
            Batch Color
          </label>
          <p className="text-xs text-slate-500">
            This color appears on test cards and the student dashboard to visually identify this batch.
          </p>

          {/* Preset swatches */}
          <div className="flex flex-wrap gap-2">
            {[
              "#6366f1", // Indigo
              "#3b82f6", // Blue
              "#8b5cf6", // Violet
              "#ec4899", // Pink
              "#f97316", // Orange
              "#10b981", // Emerald
              "#06b6d4", // Cyan
              "#f59e0b", // Amber
              "#ef4444", // Red
              "#64748b", // Slate
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setColor(preset)}
                className={`h-8 w-8 rounded-xl border-2 transition-transform hover:scale-110 ${
                  color === preset
                    ? "border-slate-900 scale-110 shadow-md"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: preset }}
                title={preset}
              />
            ))}

            {/* Custom color input */}
            {/* /* AFTER — only two changes: add 'relative' to label, add 'inset-0' to input */}
<label
  className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-xs text-slate-400 hover:border-slate-500 transition-colors overflow-hidden"
  title="Custom color"
>
  <input
    type="color"
    value={color}
    onChange={(e) => setColor(e.target.value)}
    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
  />
  <span className="pointer-events-none">+</span>
</label>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl shadow-sm"
              style={{ backgroundColor: color }}
            />
            <div
              className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold"
              style={{
                borderLeft: `4px solid ${color}`,
                backgroundColor: `${color}12`,
                color: color,
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              Batch preview
            </div>
            <code className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
              {color}
            </code>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-400"
        >
          {submitting
            ? mode === "edit"
              ? "Updating..."
              : "Creating..."
            : mode === "edit"
            ? "Update Batch"
            : "Create Batch"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/admin/batches")}
          className="rounded-xl border px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Back to Batches
        </button>
      </div>
    </form>
  );
}