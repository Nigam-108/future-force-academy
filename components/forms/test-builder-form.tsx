"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type TestMode = "PRACTICE" | "LIVE" | "ASSIGNED";
type TestStructureType = "SINGLE" | "SECTIONAL";
type TestVisibilityStatus = "DRAFT" | "LIVE" | "CLOSED";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
  errors?: unknown;
};

export type TestFormInitialValues = {
  title: string;
  slug: string;
  description: string | null;
  mode: TestMode;
  structureType: TestStructureType;
  visibilityStatus: TestVisibilityStatus;
  totalQuestions: number;
  totalMarks: number;
  durationInMinutes: number | null;
  startAt: string | null;
  endAt: string | null;
};

type TestFormProps = {
  mode?: "create" | "edit";
  testId?: string;
  initialValues?: TestFormInitialValues;
};

/**
 * Creates a URL-friendly slug from a title.
 *
 * Why:
 * - reduces admin effort
 * - keeps slugs consistent
 * - still allows manual override later
 */
function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Converts ISO datetime to datetime-local input format.
 */
function toDateTimeLocal(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function TestForm({
  mode = "create",
  testId,
  initialValues,
}: TestFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [slug, setSlug] = useState(initialValues?.slug ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? ""
  );
  const [testMode, setTestMode] = useState<TestMode>(
    initialValues?.mode ?? "PRACTICE"
  );
  const [structureType, setStructureType] = useState<TestStructureType>(
    initialValues?.structureType ?? "SINGLE"
  );
  const [visibilityStatus, setVisibilityStatus] =
    useState<TestVisibilityStatus>(initialValues?.visibilityStatus ?? "DRAFT");
  const [durationInMinutes, setDurationInMinutes] = useState(
    initialValues?.durationInMinutes?.toString() ?? ""
  );
  const [startAt, setStartAt] = useState(toDateTimeLocal(initialValues?.startAt));
  const [endAt, setEndAt] = useState(toDateTimeLocal(initialValues?.endAt));

  const [slugTouched, setSlugTouched] = useState(Boolean(initialValues?.slug));
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Auto-generated slug preview.
   * If admin has not manually edited slug, title drives the slug.
   */
  const computedSlug = useMemo(() => {
    if (slugTouched) return slug;
    return makeSlug(title);
  }, [title, slug, slugTouched]);

  function resetCreateForm() {
    setTitle("");
    setSlug("");
    setDescription("");
    setTestMode("PRACTICE");
    setStructureType("SINGLE");
    setVisibilityStatus("DRAFT");
    setDurationInMinutes("");
    setStartAt("");
    setEndAt("");
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
        mode: testMode,
        structureType,
        visibilityStatus,
        /**
         * Keep totals backend-safe and system-managed.
         * Admin should not manually type these now.
         */
        totalQuestions: initialValues?.totalQuestions ?? 0,
        totalMarks: initialValues?.totalMarks ?? 0,
        durationInMinutes:
          durationInMinutes.trim() === ""
            ? undefined
            : Number(durationInMinutes),
        startAt: startAt ? new Date(startAt).toISOString() : undefined,
        endAt: endAt ? new Date(endAt).toISOString() : undefined,
      };

      const url =
        mode === "edit" && testId ? `/api/admin/tests/${testId}` : "/api/admin/tests";

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
        throw new Error(json?.message || "Failed to save test.");
      }

      if (mode === "create") {
        setSuccessMessage(
          "Test created successfully. You can now assign questions to it."
        );
        resetCreateForm();
        router.refresh();
        return;
      }

      router.push("/admin/tests");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save test."
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

      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
        <p className="font-semibold">Simplified Test Creation</p>
        <p className="mt-1">
          This form focuses only on essential fields. Question count and marks
          are managed later through test-question assignment.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-slate-800">
            Test Title
          </label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-2xl border px-4 py-3"
            placeholder="Enter test title"
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
            placeholder="test-slug"
            required
          />
          <p className="text-xs text-slate-500">
            Auto-generated from title, but you can edit it manually.
          </p>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-slate-800">
            Description
          </label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-28 w-full rounded-2xl border px-4 py-3"
            placeholder="Optional short description for the test"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800">Mode</label>
          <select
            value={testMode}
            onChange={(event) => setTestMode(event.target.value as TestMode)}
            className="w-full rounded-2xl border px-4 py-3"
          >
            <option value="PRACTICE">Practice</option>
            <option value="LIVE">Live</option>
            <option value="ASSIGNED">Assigned</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800">
            Structure Type
          </label>
          <select
            value={structureType}
            onChange={(event) =>
              setStructureType(event.target.value as TestStructureType)
            }
            className="w-full rounded-2xl border px-4 py-3"
          >
            <option value="SINGLE">Single</option>
            <option value="SECTIONAL">Sectional</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800">
            Visibility
          </label>
          <select
            value={visibilityStatus}
            onChange={(event) =>
              setVisibilityStatus(event.target.value as TestVisibilityStatus)
            }
            className="w-full rounded-2xl border px-4 py-3"
          >
            <option value="DRAFT">Draft</option>
            <option value="LIVE">Live</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800">
            Duration (Minutes)
          </label>
          <input
            type="number"
            min={1}
            value={durationInMinutes}
            onChange={(event) => setDurationInMinutes(event.target.value)}
            className="w-full rounded-2xl border px-4 py-3"
            placeholder="e.g. 60"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800">
            Start Date & Time
          </label>
          <input
            type="datetime-local"
            value={startAt}
            onChange={(event) => setStartAt(event.target.value)}
            className="w-full rounded-2xl border px-4 py-3"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800">
            End Date & Time
          </label>
          <input
            type="datetime-local"
            value={endAt}
            onChange={(event) => setEndAt(event.target.value)}
            className="w-full rounded-2xl border px-4 py-3"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {submitting
            ? mode === "edit"
              ? "Updating..."
              : "Creating..."
            : mode === "edit"
            ? "Update Test"
            : "Create Test"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/admin/tests")}
          className="rounded-xl border px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Back to Tests
        </button>
      </div>
    </form>
  );
}