"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type TestMode = "PRACTICE" | "LIVE" | "ASSIGNED";
type TestStructureType = "SINGLE" | "SECTIONAL";
type TestVisibilityStatus = "DRAFT" | "LIVE" | "CLOSED";
type SectionTimerMode = "TOTAL" | "SECTION_WISE";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
  errors?: unknown;
};

type SectionDraft = {
  title: string;
  durationInMinutes: string;
};

export type TestBuilderFormInitialValues = {
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
  timerMode?: SectionTimerMode;
  sections?: Array<{
    title: string;
    displayOrder: number;
    durationInMinutes: number | null;
  }>;
};

type TestFormProps = {
  mode?: "create" | "edit";
  testId?: string;
  initialValues?: TestBuilderFormInitialValues;
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

function deriveInitialTimerMode(
  initialValues?: TestBuilderFormInitialValues
): SectionTimerMode {
  if (!initialValues || initialValues.structureType !== "SECTIONAL") {
    return "TOTAL";
  }

  const hasAnySectionDuration = (initialValues.sections ?? []).some(
    (section) => typeof section.durationInMinutes === "number"
  );

  return hasAnySectionDuration ? "SECTION_WISE" : "TOTAL";
}

function deriveInitialSections(
  initialValues?: TestBuilderFormInitialValues
): SectionDraft[] {
  if (initialValues?.sections?.length) {
    return initialValues.sections
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((section) => ({
        title: section.title,
        durationInMinutes:
          typeof section.durationInMinutes === "number"
            ? String(section.durationInMinutes)
            : "",
      }));
  }

  return [
    { title: "Section 1", durationInMinutes: "" },
    { title: "Section 2", durationInMinutes: "" },
  ];
}

function makeDefaultSection(index: number): SectionDraft {
  return {
    title: `Section ${index + 1}`,
    durationInMinutes: "",
  };
}

export function TestForm({
  mode = "create",
  testId,
  initialValues,
}: TestFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [slug, setSlug] = useState(initialValues?.slug ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [testMode, setTestMode] = useState<TestMode>(
    initialValues?.mode ?? "PRACTICE"
  );
  const [structureType, setStructureType] = useState<TestStructureType>(
    initialValues?.structureType ?? "SINGLE"
  );
  const [visibilityStatus, setVisibilityStatus] =
    useState<TestVisibilityStatus>(initialValues?.visibilityStatus ?? "DRAFT");

  const [timerMode, setTimerMode] = useState<SectionTimerMode>(
    initialValues?.timerMode ?? deriveInitialTimerMode(initialValues)
  );

  const [durationInMinutes, setDurationInMinutes] = useState(
    initialValues?.durationInMinutes?.toString() ?? ""
  );

  const [sections, setSections] = useState<SectionDraft[]>(
    deriveInitialSections(initialValues)
  );

  const [sectionCountInput, setSectionCountInput] = useState(
    String(deriveInitialSections(initialValues).length)
  );

  const [startAt, setStartAt] = useState(toDateTimeLocal(initialValues?.startAt));
  const [endAt, setEndAt] = useState(toDateTimeLocal(initialValues?.endAt));
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValues?.slug));
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const computedSlug = useMemo(() => {
    if (slugTouched) return slug;
    return makeSlug(title);
  }, [title, slug, slugTouched]);

  function syncSectionsToCount(nextCount: number) {
    setSections((current) => {
      if (nextCount <= current.length) {
        return current.slice(0, nextCount);
      }

      const next = [...current];
      while (next.length < nextCount) {
        next.push(makeDefaultSection(next.length));
      }
      return next;
    });
  }

  function handleSectionCountBlur() {
    const parsed = Number(sectionCountInput);

    if (!Number.isFinite(parsed) || parsed < 1) {
      setSectionCountInput(String(sections.length));
      return;
    }

    const nextCount = Math.min(12, Math.max(1, Math.floor(parsed)));
    setSectionCountInput(String(nextCount));
    syncSectionsToCount(nextCount);
  }

  function updateSection(
    index: number,
    patch: Partial<SectionDraft>
  ) {
    setSections((current) =>
      current.map((section, currentIndex) =>
        currentIndex === index ? { ...section, ...patch } : section
      )
    );
  }

  function addSection() {
    setSections((current) => {
      const next = [...current, makeDefaultSection(current.length)];
      setSectionCountInput(String(next.length));
      return next;
    });
  }

  function removeSection(index: number) {
    setSections((current) => {
      if (current.length <= 1) return current;
      const next = current.filter((_, currentIndex) => currentIndex !== index);
      setSectionCountInput(String(next.length));
      return next;
    });
  }

  function resetCreateForm() {
    setTitle("");
    setSlug("");
    setDescription("");
    setTestMode("PRACTICE");
    setStructureType("SINGLE");
    setVisibilityStatus("DRAFT");
    setTimerMode("TOTAL");
    setDurationInMinutes("");
    const nextSections = [makeDefaultSection(0), makeDefaultSection(1)];
    setSections(nextSections);
    setSectionCountInput(String(nextSections.length));
    setStartAt("");
    setEndAt("");
    setSlugTouched(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const normalizedSections =
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
          : [];

      const payload = {
        title: title.trim(),
        slug: computedSlug.trim(),
        description: description.trim() || undefined,
        mode: testMode,
        structureType,
        visibilityStatus,
        totalQuestions: initialValues?.totalQuestions ?? 0,
        totalMarks: initialValues?.totalMarks ?? 0,
        timerMode,
        durationInMinutes:
          structureType === "SECTIONAL" && timerMode === "SECTION_WISE"
            ? undefined
            : durationInMinutes.trim() === ""
            ? undefined
            : Number(durationInMinutes),
        sections: normalizedSections,
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
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Simplified Test Creation
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          This form focuses on essential fields. For sectional tests, you can now
          define section count, names, and timer structure here itself.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
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
              onChange={(event) => {
                const next = event.target.value as TestStructureType;
                setStructureType(next);

                if (next === "SINGLE") {
                  setTimerMode("TOTAL");
                }
              }}
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

          {structureType === "SECTIONAL" ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800">
                  Timer Mode
                </label>
                <select
                  value={timerMode}
                  onChange={(event) =>
                    setTimerMode(event.target.value as SectionTimerMode)
                  }
                  className="w-full rounded-2xl border px-4 py-3"
                >
                  <option value="TOTAL">Total timer for whole test</option>
                  <option value="SECTION_WISE">Section-wise timer</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800">
                  Number of Sections
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={sectionCountInput}
                  onChange={(event) => setSectionCountInput(event.target.value)}
                  onBlur={handleSectionCountBlur}
                  className="w-full rounded-2xl border px-4 py-3"
                  placeholder="e.g. 3"
                />
              </div>
            </>
          ) : null}

          {(structureType === "SINGLE" || timerMode === "TOTAL") ? (
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
          ) : null}

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
      </div>

      {structureType === "SECTIONAL" ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Sections</h3>
              <p className="mt-1 text-sm text-slate-600">
                Add section names{timerMode === "SECTION_WISE" ? " and section-wise timers" : ""}.
              </p>
            </div>

            <button
              type="button"
              onClick={addSection}
              className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Add Section
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {sections.map((section, index) => (
              <div
                key={`section-${index}`}
                className="grid gap-4 rounded-2xl border border-slate-200 p-4 md:grid-cols-12"
              >
                <div className="md:col-span-6 space-y-2">
                  <label className="text-sm font-semibold text-slate-800">
                    Section {index + 1} Name
                  </label>
                  <input
                    value={section.title}
                    onChange={(event) =>
                      updateSection(index, { title: event.target.value })
                    }
                    className="w-full rounded-2xl border px-4 py-3"
                    placeholder={`Section ${index + 1}`}
                    required={structureType === "SECTIONAL"}
                  />
                </div>

                {timerMode === "SECTION_WISE" ? (
                  <div className="md:col-span-4 space-y-2">
                    <label className="text-sm font-semibold text-slate-800">
                      Section Timer (Minutes)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={section.durationInMinutes}
                      onChange={(event) =>
                        updateSection(index, {
                          durationInMinutes: event.target.value,
                        })
                      }
                      className="w-full rounded-2xl border px-4 py-3"
                      placeholder="e.g. 20"
                    />
                  </div>
                ) : (
                  <div className="md:col-span-4 flex items-end">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      Uses overall test timer
                    </div>
                  </div>
                )}

                <div className="md:col-span-2 flex items-end">
                  <button
                    type="button"
                    onClick={() => removeSection(index)}
                    disabled={sections.length <= 1}
                    className="w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

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

export { TestForm as TestBuilderForm };