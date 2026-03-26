"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type TestMode = "PRACTICE" | "LIVE" | "ASSIGNED";
type TestStructureType = "SINGLE" | "SECTIONAL";
type TestVisibilityStatus = "DRAFT" | "LIVE" | "CLOSED";
type TimerMode = "TOTAL" | "SECTION_WISE";

type StructuralEditBlockDetails = {
  code?: string;
  redirectTo?: string;
  actionLabel?: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
  errors?: unknown;
  details?: StructuralEditBlockDetails | null;
};

type TestSectionFormValue = {
  title: string;
  durationInMinutes: string;
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
  allowSectionSwitching?: boolean;
  startAt: string | null;
  endAt: string | null;
  sections?: Array<{
    id?: string;
    title: string;
    displayOrder: number;
    durationInMinutes?: number | null;
  }>;
};

type TestFormProps = {
  mode?: "create" | "edit";
  testId?: string;
  initialValues?: TestFormInitialValues;
};

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

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

function buildInitialSections(
  initialValues?: TestFormInitialValues
): TestSectionFormValue[] {
  if (initialValues?.structureType === "SECTIONAL" && initialValues.sections?.length) {
    return initialValues.sections
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((section) => ({
        title: section.title ?? "",
        durationInMinutes:
          section.durationInMinutes != null
            ? String(section.durationInMinutes)
            : "",
      }));
  }

  return [{ title: "", durationInMinutes: "" }];
}

export function TestForm({
  mode = "create",
  testId,
  initialValues,
}: TestFormProps) {
  const router = useRouter();

  const hasSectionDurations =
    initialValues?.structureType === "SECTIONAL" &&
    (initialValues.sections?.some(
      (section) => section.durationInMinutes != null && section.durationInMinutes > 0
    ) ??
      false);

  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [slug, setSlug] = useState(initialValues?.slug ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [testMode, setTestMode] = useState<TestMode>(
    initialValues?.mode ?? "PRACTICE"
  );
  const [structureType, setStructureType] = useState<TestStructureType>(
    initialValues?.structureType ?? "SINGLE"
  );
  const [visibilityStatus, setVisibilityStatus] = useState<TestVisibilityStatus>(
    initialValues?.visibilityStatus ?? "DRAFT"
  );
  const [timerMode, setTimerMode] = useState<TimerMode>(
    hasSectionDurations ? "SECTION_WISE" : "TOTAL"
  );
  const [allowSectionSwitching, setAllowSectionSwitching] = useState(
    initialValues?.allowSectionSwitching ?? false
  );
  const [durationInMinutes, setDurationInMinutes] = useState(
    initialValues?.durationInMinutes?.toString() ?? ""
  );
  const [sections, setSections] = useState<TestSectionFormValue[]>(
    buildInitialSections(initialValues)
  );
  const [startAt, setStartAt] = useState(toDateTimeLocal(initialValues?.startAt));
  const [endAt, setEndAt] = useState(toDateTimeLocal(initialValues?.endAt));
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValues?.slug));
  const [submitting, setSubmitting] = useState(false);
const [errorMessage, setErrorMessage] = useState<string | null>(null);
const [submitErrorDetails, setSubmitErrorDetails] =
  useState<StructuralEditBlockDetails | null>(null);
const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    setTimerMode("TOTAL");
    setAllowSectionSwitching(false);
    setDurationInMinutes("");
    setSections([{ title: "", durationInMinutes: "" }]);
    setStartAt("");
    setEndAt("");
    setSlugTouched(false);
  }

  function handleStructureTypeChange(next: TestStructureType) {
    setStructureType(next);

    if (next === "SINGLE") {
      setTimerMode("TOTAL");
      setAllowSectionSwitching(false);
      setSections([{ title: "", durationInMinutes: "" }]);
    }
  }

  function handleTimerModeChange(next: TimerMode) {
    setTimerMode(next);

    if (next === "SECTION_WISE") {
      setAllowSectionSwitching(false);
      setDurationInMinutes("");
    }
  }

  function addSection() {
    setSections((prev) => [...prev, { title: "", durationInMinutes: "" }]);
  }

  function removeSection(index: number) {
    setSections((prev) => {
      if (prev.length === 1) {
        return [{ title: "", durationInMinutes: "" }];
      }

      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  function updateSection(
    index: number,
    key: keyof TestSectionFormValue,
    value: string
  ) {
    setSections((prev) =>
      prev.map((section, itemIndex) =>
        itemIndex === index ? { ...section, [key]: value } : section
      )
    );
  }

  async function handleSubmit(event: React.FormEvent) {
  event.preventDefault();
  setSubmitting(true);
  setErrorMessage(null);
  setSubmitErrorDetails(null);
  setSuccessMessage(null);

  try {
      const payload = {
        title: title.trim(),
        slug: computedSlug.trim(),
        description: description.trim() || undefined,
        mode: testMode,
        structureType,
        visibilityStatus,
        totalQuestions: initialValues?.totalQuestions ?? 0,
        totalMarks: initialValues?.totalMarks ?? 0,
        durationInMinutes:
          structureType === "SECTIONAL"
            ? timerMode === "TOTAL"
              ? durationInMinutes.trim() === ""
                ? undefined
                : Number(durationInMinutes)
              : undefined
            : durationInMinutes.trim() === ""
            ? undefined
            : Number(durationInMinutes),
        timerMode,
        allowSectionSwitching:
          structureType === "SECTIONAL" && timerMode === "TOTAL"
            ? allowSectionSwitching
            : false,
        sections:
          structureType === "SECTIONAL"
            ? sections.map((section, index) => ({
                title: section.title.trim(),
                displayOrder: index + 1,
                durationInMinutes:
                  timerMode === "SECTION_WISE"
                    ? section.durationInMinutes.trim() === ""
                      ? undefined
                      : Number(section.durationInMinutes)
                    : undefined,
              }))
            : [],
        startAt: startAt ? new Date(startAt).toISOString() : undefined,
        endAt: endAt ? new Date(endAt).toISOString() : undefined,
      };

      const url =
        mode === "edit" && testId
          ? `/api/admin/tests/${testId}`
          : "/api/admin/tests";

      const method = mode === "edit" ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = (await response.json().catch(() => null)) as
  | ApiResponse<{ id: string }>
  | null;

if (!response.ok || !json?.success) {
  const message = json?.message || "Failed to save test.";
  const details = json?.details ?? null;

  setErrorMessage(message);
  setSubmitErrorDetails(details);

  return;
}

      if (mode === "create") {
        setSuccessMessage("Test created successfully. You can now assign questions to it.");
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
  setSubmitErrorDetails(null);
} finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border bg-white p-6 shadow-sm">
      {errorMessage ? (
  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
    <p>{errorMessage}</p>

    {submitErrorDetails?.code === "TEST_STRUCTURAL_EDIT_BLOCKED" &&
    submitErrorDetails?.redirectTo ? (
      <div className="mt-3">
        <button
          type="button"
          onClick={() => router.push(submitErrorDetails.redirectTo!)}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          {submitErrorDetails.actionLabel ?? "Go to Assigned Questions"}
        </button>
      </div>
    ) : null}
  </div>
) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <div>
        <h2 className="text-xl font-semibold text-slate-900">Test Builder</h2>
        <p className="mt-1 text-sm text-slate-600">
          Configure structure, timing, and section behavior before assigning questions.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-slate-800">Test Title</label>
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
          <label className="text-sm font-semibold text-slate-800">Description</label>
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
          <label className="text-sm font-semibold text-slate-800">Structure Type</label>
          <select
            value={structureType}
            onChange={(event) =>
              handleStructureTypeChange(event.target.value as TestStructureType)
            }
            className="w-full rounded-2xl border px-4 py-3"
          >
            <option value="SINGLE">Single</option>
            <option value="SECTIONAL">Sectional</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800">Visibility</label>
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

        {structureType === "SECTIONAL" ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">Timer Mode</label>
              <select
                value={timerMode}
                onChange={(event) =>
                  handleTimerModeChange(event.target.value as TimerMode)
                }
                className="w-full rounded-2xl border px-4 py-3"
              >
                <option value="TOTAL">Overall Total Timer</option>
                <option value="SECTION_WISE">Section-wise Timer</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">
                Allow Section Switching
              </label>

              {timerMode === "SECTION_WISE" ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  <div className="flex items-center justify-between gap-3">
                    <span>Students can switch freely between sections</span>
                    <input
                      type="checkbox"
                      checked={false}
                      disabled
                      className="cursor-not-allowed opacity-60"
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    This option is not allowed when section-wise timing is enabled.
                  </p>
                </div>
              ) : (
                <label className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={allowSectionSwitching}
                    onChange={(event) => setAllowSectionSwitching(event.target.checked)}
                  />
                  <span>Students can switch freely between sections during the test</span>
                </label>
              )}
            </div>

            {timerMode === "TOTAL" ? (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800">
                  Total Duration (Minutes)
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
            ) : null}

            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-800">Sections</label>
                <button
                  type="button"
                  onClick={addSection}
                  className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Add Section
                </button>
              </div>

              <div className="space-y-4">
                {sections.map((section, index) => (
                  <div
                    key={`section-${index}`}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-800">
                        Section {index + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeSection(index)}
                        className="text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                          Section Name
                        </label>
                        <input
                          value={section.title}
                          onChange={(event) =>
                            updateSection(index, "title", event.target.value)
                          }
                          className="w-full rounded-2xl border px-4 py-3"
                          placeholder={`Enter section ${index + 1} name`}
                        />
                      </div>

                      {timerMode === "SECTION_WISE" ? (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">
                            Section Duration (Minutes)
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={section.durationInMinutes}
                            onChange={(event) =>
                              updateSection(
                                index,
                                "durationInMinutes",
                                event.target.value
                              )
                            }
                            className="w-full rounded-2xl border px-4 py-3"
                            placeholder="e.g. 20"
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
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
        )}

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