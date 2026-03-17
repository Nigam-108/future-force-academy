"use client";

import { useEffect, useMemo, useState } from "react";

type QuestionType =
  | "SINGLE_CORRECT"
  | "TRUE_FALSE"
  | "ASSERTION_REASON"
  | "MULTI_CORRECT"
  | "MATCH_THE_FOLLOWING";

type DifficultyLevel = "EASY" | "MEDIUM" | "HARD";
type QuestionStatus = "DRAFT" | "APPROVED" | "ACTIVE" | "REJECTED";
type TestStructureType = "SINGLE" | "SECTIONAL";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
  errors?: unknown;
};

type AvailableQuestion = {
  id: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  status: QuestionStatus;
  questionText: string;
  correctAnswer: string | null;
  tags: string[];
};

type QuestionPoolResponse = {
  items: AvailableQuestion[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type AssignedQuestionItem = {
  id: string;
  testId: string;
  questionId: string;
  sectionId: string | null;
  displayOrder: number;
  positiveMarks: number | null;
  negativeMarks: number | null;
  question: {
    id: string;
    questionText: string;
    correctAnswer: string | null;
    type: QuestionType;
    difficulty: DifficultyLevel;
    status: QuestionStatus;
  };
  section: {
    id: string;
    title: string;
    displayOrder: number;
  } | null;
};

type AssignedQuestionsResponse = {
  test: {
    id: string;
    title: string;
    slug: string;
    structureType: TestStructureType;
    totalQuestions?: number;
    totalMarks?: number;
  };
  items: AssignedQuestionItem[];
  totalAssigned: number;
};

type TestSection = {
  id: string;
  title: string;
  displayOrder: number;
  totalQuestions: number;
  durationInMinutes: number | null;
  positiveMarks: number | null;
  negativeMarks: number | null;
};

type RowActionState = {
  id: string;
  type: "delete";
} | null;

type Props = {
  testId: string;
  testTitle: string;
  structureType: TestStructureType;
  sections: TestSection[];
};

const DEFAULT_POSITIVE_MARKS = "1";
const DEFAULT_NEGATIVE_MARKS = "0.25";

/**
 * Small helper for trimming long text in cards and tray rows.
 */
function truncateText(text: string, limit = 140) {
  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit)}...`;
}

/**
 * Basic GET wrapper used throughout this screen.
 */
async function apiGet<T>(url: string): Promise<ApiResponse<T>> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const json = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  return {
    success: Boolean(json?.success),
    message: json?.message ?? "Request failed.",
    data: (json?.data ?? null) as T | null,
    errors: json?.errors,
  };
}

/**
 * Basic POST wrapper used for assignment actions.
 */
async function apiPost<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  return {
    success: Boolean(json?.success),
    message: json?.message ?? "Request failed.",
    data: (json?.data ?? null) as T | null,
    errors: json?.errors,
  };
}

/**
 * Basic DELETE wrapper for removing already-assigned rows.
 */
async function apiDelete<T>(url: string): Promise<ApiResponse<T>> {
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  });

  const json = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  return {
    success: Boolean(json?.success),
    message: json?.message ?? "Request failed.",
    data: (json?.data ?? null) as T | null,
    errors: json?.errors,
  };
}

export function TestQuestionAssignmentClient({
  testId,
  testTitle,
  structureType,
  sections,
}: Props) {
  const [assigned, setAssigned] = useState<AssignedQuestionItem[]>([]);
  const [assignedLoading, setAssignedLoading] = useState(true);
  const [rowAction, setRowAction] = useState<RowActionState>(null);

  const [questionPool, setQuestionPool] = useState<AvailableQuestion[]>([]);
  const [questionPoolLoading, setQuestionPoolLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  /**
   * selectedQuestionIds:
   * - stores all question IDs selected by the admin
   * - survives across multiple different searches
   * - acts as the real assignment source of truth
   */
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  /**
   * selectedQuestionMap:
   * - stores actual question objects for selected IDs
   * - lets us show a tray even when that question is no longer visible
   *   in the current search result set
   */
  const [selectedQuestionMap, setSelectedQuestionMap] = useState<
    Record<string, AvailableQuestion>
  >({});

  const [sectionId, setSectionId] = useState("");
  const [positiveMarks, setPositiveMarks] = useState(DEFAULT_POSITIVE_MARKS);
  const [negativeMarks, setNegativeMarks] = useState(DEFAULT_NEGATIVE_MARKS);
  const [submitting, setSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Fast lookup of already-assigned question IDs.
   * These should never appear as assignable in the visible pool.
   */
  const assignedQuestionIds = useMemo(
    () => new Set(assigned.map((item) => item.questionId)),
    [assigned]
  );

  /**
   * Only show questions that are not yet assigned to this test.
   */
  const visibleQuestionPool = useMemo(
    () => questionPool.filter((item) => !assignedQuestionIds.has(item.id)),
    [questionPool, assignedQuestionIds]
  );

  /**
   * Materialized selected question list from our persistent map.
   */
  const selectedQuestions = useMemo(() => {
    return selectedQuestionIds
      .map((id) => selectedQuestionMap[id])
      .filter(Boolean);
  }, [selectedQuestionIds, selectedQuestionMap]);

  /**
   * Useful quick count for currently visible and selectable results.
   */
  const visibleSelectableQuestionIds = useMemo(() => {
    return visibleQuestionPool.map((item) => item.id);
  }, [visibleQuestionPool]);

  /**
   * Whether every currently visible result is selected.
   * This applies only to the current filtered result set,
   * not to all selected questions globally.
   */
  const allVisibleSelected =
    visibleSelectableQuestionIds.length > 0 &&
    visibleSelectableQuestionIds.every((id) => selectedQuestionIds.includes(id));

  function clearFeedback() {
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  /**
   * Adds or removes one question from the persistent selection state.
   */
  function toggleQuestionSelection(question: AvailableQuestion) {
    clearFeedback();

    setSelectedQuestionIds((previous) =>
      previous.includes(question.id)
        ? previous.filter((item) => item !== question.id)
        : [...previous, question.id]
    );

    setSelectedQuestionMap((previous) => {
      const next = { ...previous };

      if (next[question.id]) {
        delete next[question.id];
      } else {
        next[question.id] = question;
      }

      return next;
    });
  }

  /**
   * Selects every currently visible question.
   *
   * Important:
   * This does NOT remove already-selected questions from previous searches.
   * It adds to the persistent tray.
   */
  function selectAllVisible() {
    clearFeedback();

    setSelectedQuestionIds((previous) => {
      const next = new Set(previous);
      visibleQuestionPool.forEach((item) => next.add(item.id));
      return Array.from(next);
    });

    setSelectedQuestionMap((previous) => {
      const next = { ...previous };
      visibleQuestionPool.forEach((item) => {
        next[item.id] = item;
      });
      return next;
    });
  }

  /**
   * Clears selection only for currently visible search results.
   * Useful when admin selected a result set accidentally.
   */
  function clearVisibleSelection() {
    clearFeedback();

    setSelectedQuestionIds((previous) =>
      previous.filter((id) => !visibleSelectableQuestionIds.includes(id))
    );

    setSelectedQuestionMap((previous) => {
      const next = { ...previous };
      visibleSelectableQuestionIds.forEach((id) => {
        delete next[id];
      });
      return next;
    });
  }

  /**
   * Clears all selections globally.
   */
  function clearAllSelection() {
    clearFeedback();
    setSelectedQuestionIds([]);
    setSelectedQuestionMap({});
  }

  /**
   * Removes one selected question directly from the selected tray.
   */
  function removeSelectedQuestion(questionId: string) {
    clearFeedback();

    setSelectedQuestionIds((previous) =>
      previous.filter((item) => item !== questionId)
    );

    setSelectedQuestionMap((previous) => {
      const next = { ...previous };
      delete next[questionId];
      return next;
    });
  }

  /**
   * Loads already-assigned rows for the current test.
   */
  async function loadAssigned() {
    setAssignedLoading(true);
    setErrorMessage(null);

    try {
      const response = await apiGet<AssignedQuestionsResponse>(
        `/api/admin/tests/${testId}/questions`
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to load assigned questions.");
      }

      setAssigned(response.data.items);

      /**
       * If some selected question got assigned in another action,
       * remove it from selection tray automatically.
       */
      const assignedIds = new Set(response.data.items.map((item) => item.questionId));

      setSelectedQuestionIds((previous) =>
        previous.filter((questionId) => !assignedIds.has(questionId))
      );

      setSelectedQuestionMap((previous) => {
        const next = { ...previous };
        Object.keys(next).forEach((id) => {
          if (assignedIds.has(id)) {
            delete next[id];
          }
        });
        return next;
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load assigned questions."
      );
    } finally {
      setAssignedLoading(false);
    }
  }

  /**
   * Loads the searchable question bank.
   *
   * Current repo behavior:
   * - only ACTIVE questions
   * - limit 100
   * - optional text search
   */
  async function loadQuestionPool(nextSearch?: string) {
    setQuestionPoolLoading(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "100");
      params.set("status", "ACTIVE");

      const effectiveSearch = (nextSearch ?? appliedSearch).trim();

      if (effectiveSearch) {
        params.set("search", effectiveSearch);
      }

      const response = await apiGet<QuestionPoolResponse>(
        `/api/admin/questions?${params.toString()}`
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to load question bank.");
      }

      setQuestionPool(response.data.items);

      /**
       * Keep selected map fresh for any selected IDs appearing
       * in the current result set.
       */
      setSelectedQuestionMap((previous) => {
        const next = { ...previous };
        response.data?.items.forEach((item) => {
          if (selectedQuestionIds.includes(item.id)) {
            next[item.id] = item;
          }
        });
        return next;
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load question bank."
      );
    } finally {
      setQuestionPoolLoading(false);
    }
  }

  useEffect(() => {
    void loadAssigned();
  }, [testId]);

  useEffect(() => {
    void loadQuestionPool("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  /**
   * Applies the current search input to the visible question bank.
   */
  async function handleSearch() {
    clearFeedback();
    setAppliedSearch(searchInput);
    await loadQuestionPool(searchInput);
  }

  /**
   * Assigns every currently selected question from the tray.
   *
   * Important:
   * This does NOT depend on the currently visible search result.
   * So admin can build a multi-search selection set and assign all together.
   */
  async function handleAssignSelected() {
    if (selectedQuestionIds.length === 0) {
      setErrorMessage("Select at least one question first.");
      return;
    }

    if (structureType === "SECTIONAL" && sections.length === 0) {
      setErrorMessage(
        "This is a sectional test but no sections exist yet. Create sections first."
      );
      return;
    }

    if (structureType === "SECTIONAL" && !sectionId) {
      setErrorMessage("Select a section before assigning questions.");
      return;
    }

    setSubmitting(true);
    clearFeedback();

    try {
      const payload = {
        items: selectedQuestionIds.map((questionId) => ({
          questionId,
          sectionId: structureType === "SECTIONAL" ? sectionId : null,
          positiveMarks:
            positiveMarks.trim() === "" ? null : Number(positiveMarks),
          negativeMarks:
            negativeMarks.trim() === "" ? null : Number(negativeMarks),
        })),
      };

      const response = await apiPost<AssignedQuestionsResponse>(
        `/api/admin/tests/${testId}/questions`,
        payload
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to assign questions to test.");
      }

      setSuccessMessage(
        `${selectedQuestionIds.length} question(s) assigned successfully. Random order is handled automatically.`
      );

      setSelectedQuestionIds([]);
      setSelectedQuestionMap({});

      await loadAssigned();
      await loadQuestionPool(appliedSearch);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to assign questions to test."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /**
   * Removes one already-assigned row from the test.
   */
  async function handleAssignedDelete(assignmentId: string) {
    const assignedItem = assigned.find((item) => item.id === assignmentId);

    if (!assignedItem) {
      setErrorMessage("Assigned question row not found.");
      return;
    }

    const confirmed = window.confirm(
      `Remove this question from "${testTitle}"?\n\n${truncateText(
        assignedItem.question.questionText,
        100
      )}`
    );

    if (!confirmed) {
      return;
    }

    setRowAction({
      id: assignmentId,
      type: "delete",
    });
    clearFeedback();

    try {
      const response = await apiDelete<{ deletedAssignmentId: string }>(
        `/api/admin/tests/${testId}/questions/${assignmentId}`
      );

      if (!response.success) {
        throw new Error(
          response.message || "Failed to remove assigned question row."
        );
      }

      setSuccessMessage("Assigned question removed successfully.");

      await loadAssigned();
      await loadQuestionPool(appliedSearch);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to remove assigned question row."
      );
    } finally {
      setRowAction(null);
    }
  }

  return (
    <div className="space-y-6">
      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
              Assignment Console
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">
              {testTitle}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Structure: <span className="font-medium">{structureType}</span>
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Question order is randomized automatically on the backend.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Currently Assigned
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {assigned.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Selected In Tray
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {selectedQuestionIds.length}
              </p>
            </div>
          </div>
        </div>

        {structureType === "SECTIONAL" ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Sections</h3>

            {sections.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">
                No sections found for this sectional test yet.
              </p>
            ) : (
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <p className="font-medium text-slate-900">{section.title}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      Order {section.displayOrder} • {section.totalQuestions} questions
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Assign Selected Questions
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Build a tray from multiple searches, then assign everything together.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Ready To Assign
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {selectedQuestionIds.length}
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            type="number"
            min={0}
            step="0.25"
            value={positiveMarks}
            onChange={(event) => setPositiveMarks(event.target.value)}
            className="rounded-xl border px-4 py-3 text-sm"
            placeholder="Positive marks"
          />

          <input
            type="number"
            min={0}
            step="0.25"
            value={negativeMarks}
            onChange={(event) => setNegativeMarks(event.target.value)}
            className="rounded-xl border px-4 py-3 text-sm"
            placeholder="Negative marks"
          />

          {structureType === "SECTIONAL" ? (
            <select
              value={sectionId}
              onChange={(event) => setSectionId(event.target.value)}
              className="rounded-xl border px-4 py-3 text-sm"
            >
              <option value="">Select section</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.title}
                </option>
              ))}
            </select>
          ) : (
            <div className="rounded-xl border border-dashed px-4 py-3 text-sm text-slate-500">
              Single test — no section mapping needed
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleAssignSelected()}
            disabled={selectedQuestionIds.length === 0 || submitting}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {submitting ? "Assigning..." : "Assign Selected"}
          </button>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Default marks are set to +1 and -0.25 for fast MCQ paper building, but you
          can still change them before assigning.
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Selected Questions Tray
              </h4>
              <p className="mt-1 text-xs text-slate-600">
                Selection stays preserved even when you search different keywords.
              </p>
            </div>

            <button
              type="button"
              onClick={clearAllSelection}
              disabled={selectedQuestionIds.length === 0}
              className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear All Selected
            </button>
          </div>

          {selectedQuestions.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">
              No selected questions yet. Search and pick questions below to build your tray.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {selectedQuestions.map((question, index) => (
                <div
                  key={question.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Selected #{index + 1}
                    </p>
                    <h5 className="mt-1 text-sm font-semibold text-slate-900">
                      {truncateText(question.questionText, 160)}
                    </h5>
                    <p className="mt-1 text-xs text-slate-600">
                      Correct: {question.correctAnswer || "—"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeSelectedQuestion(question.id)}
                    className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">
            Already Assigned Questions
          </h3>

          <button
            type="button"
            onClick={() => void loadAssigned()}
            className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {assignedLoading ? (
          <p className="text-sm text-slate-600">Loading assigned questions...</p>
        ) : assigned.length === 0 ? (
          <p className="text-sm text-slate-600">
            No questions are assigned to this test yet.
          </p>
        ) : (
          <div className="space-y-4">
            {assigned.map((item) => {
              const rowBusy = rowAction?.id === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <h4 className="text-base font-semibold text-slate-900">
                        #{item.displayOrder} — {truncateText(item.question.questionText, 160)}
                      </h4>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                          +{item.positiveMarks ?? "—"}
                        </span>
                        <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">
                          -{item.negativeMarks ?? "—"}
                        </span>
                        <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">
                          Correct: {item.question.correctAnswer || "—"}
                        </span>
                        {item.section ? (
                          <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-700">
                            Section: {item.section.title}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleAssignedDelete(item.id)}
                      disabled={rowBusy}
                      className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {rowBusy ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Question Bank</h3>
            <p className="mt-1 text-sm text-slate-600">
              Search active questions, select across multiple searches, and build one assignable tray.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadQuestionPool(appliedSearch)}
            className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Refresh Results
          </button>
        </div>

        <div className="mb-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="rounded-xl border px-4 py-3"
            placeholder="Search question text"
          />

          <button
            type="button"
            onClick={() => void handleSearch()}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Search
          </button>

          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              setAppliedSearch("");
              void loadQuestionPool("");
            }}
            className="rounded-xl border px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Clear Search
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={allVisibleSelected ? clearVisibleSelection : selectAllVisible}
            disabled={visibleSelectableQuestionIds.length === 0}
            className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {allVisibleSelected ? "Clear Visible Selection" : "Select All Visible"}
          </button>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
            Visible Results: {visibleQuestionPool.length}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
            Selected Overall: {selectedQuestionIds.length}
          </div>

          {appliedSearch ? (
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-700">
              Current Search: {appliedSearch}
            </div>
          ) : null}
        </div>

        {questionPoolLoading ? (
          <p className="text-sm text-slate-600">Loading question bank...</p>
        ) : visibleQuestionPool.length === 0 ? (
          <p className="text-sm text-slate-600">
            No unassigned active questions matched the current search.
          </p>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {visibleQuestionPool.map((question) => {
              const checked = selectedQuestionIds.includes(question.id);

              return (
                <label
                  key={question.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                    checked
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleQuestionSelection(question)}
                    className="mt-1 h-4 w-4"
                  />

                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-semibold text-slate-900">
                      {truncateText(question.questionText, 180)}
                    </h4>
                    <p className="mt-2 text-sm text-slate-600">
                      Correct: {question.correctAnswer || "—"}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}