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
 * Trims long question text for cards / tray rows.
 */
function truncateText(text: string, limit = 140) {
  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit)}...`;
}

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

  /**
   * searchInput:
   * - the text currently typed by admin
   *
   * appliedSearch:
   * - the text currently used to fetch visible results
   *
   * This separation gives better search UX and makes refresh behavior predictable.
   */
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  /**
   * selectedQuestionIds:
   * - persistent selection across multiple searches
   * - the actual source used for tray assignment
   */
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  /**
   * selectedQuestionMap:
   * - stores selected question objects
   * - allows tray rendering even when selected questions are no longer visible
   *   in the current filtered question bank result set
   */
  const [selectedQuestionMap, setSelectedQuestionMap] = useState<
    Record<string, AvailableQuestion>
  >({});

  const [sectionId, setSectionId] = useState("");
  const [positiveMarks, setPositiveMarks] = useState(DEFAULT_POSITIVE_MARKS);
  const [negativeMarks, setNegativeMarks] = useState(DEFAULT_NEGATIVE_MARKS);
  const [submitting, setSubmitting] = useState(false);

  /**
   * Separate loading state for one-click visible assignment.
   */
  const [assigningVisible, setAssigningVisible] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Assigned question IDs should never appear as assignable in the bank.
   */
  const assignedQuestionIds = useMemo(
    () => new Set(assigned.map((item) => item.questionId)),
    [assigned]
  );

  /**
   * Visible question pool after removing already-assigned items.
   */
  const visibleQuestionPool = useMemo(
    () => questionPool.filter((item) => !assignedQuestionIds.has(item.id)),
    [questionPool, assignedQuestionIds]
  );

  /**
   * Selected question objects rendered in the tray.
   */
  const selectedQuestions = useMemo(() => {
    return selectedQuestionIds
      .map((id) => selectedQuestionMap[id])
      .filter(Boolean);
  }, [selectedQuestionIds, selectedQuestionMap]);

  /**
   * IDs for only the currently visible search result set.
   */
  const visibleSelectableQuestionIds = useMemo(
    () => visibleQuestionPool.map((item) => item.id),
    [visibleQuestionPool]
  );

  /**
   * Whether every currently visible result is already selected.
   */
  const allVisibleSelected =
    visibleSelectableQuestionIds.length > 0 &&
    visibleSelectableQuestionIds.every((id) => selectedQuestionIds.includes(id));

  function clearFeedback() {
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  /**
   * Keeps tray selection persistent across searches.
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
   * Adds every currently visible result into the persistent tray.
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
   * Clears only current search result selection from tray.
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
   * Clears full tray.
   */
  function clearAllSelection() {
    clearFeedback();
    setSelectedQuestionIds([]);
    setSelectedQuestionMap({});
  }

  /**
   * Removes one selected question directly from tray.
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
       * Auto-remove anything from tray that has now become assigned.
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
       * Refresh selectedQuestionMap for any selected items now visible.
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

  async function handleSearch() {
    clearFeedback();
    setAppliedSearch(searchInput);
    await loadQuestionPool(searchInput);
  }

  /**
   * Shared validation before any assignment action.
   */
  function validateAssignmentContext(selectedCount: number) {
    if (selectedCount === 0) {
      setErrorMessage("Select at least one question first.");
      return false;
    }

    if (structureType === "SECTIONAL" && sections.length === 0) {
      setErrorMessage(
        "This is a sectional test but no sections exist yet. Create sections first."
      );
      return false;
    }

    if (structureType === "SECTIONAL" && !sectionId) {
      setErrorMessage("Select a section before assigning questions.");
      return false;
    }

    return true;
  }

  /**
   * Assigns all currently selected tray items.
   */
  async function handleAssignSelected() {
    if (!validateAssignmentContext(selectedQuestionIds.length)) {
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
   * One-click action:
   * assigns every currently visible search result directly,
   * without first moving them into the persistent tray.
   *
   * This is the fastest workflow when admin wants:
   * "whatever is visible right now -> assign all"
   */
  async function handleAssignAllVisible() {
    if (!validateAssignmentContext(visibleSelectableQuestionIds.length)) {
      return;
    }

    setAssigningVisible(true);
    clearFeedback();

    try {
      const payload = {
        items: visibleSelectableQuestionIds.map((questionId) => ({
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
        throw new Error(
          response.message || "Failed to assign visible questions to test."
        );
      }

      setSuccessMessage(
        `${visibleSelectableQuestionIds.length} visible question(s) assigned successfully.`
      );

      /**
       * Remove visible items from tray if any were already selected there.
       */
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

      await loadAssigned();
      await loadQuestionPool(appliedSearch);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to assign visible questions to test."
      );
    } finally {
      setAssigningVisible(false);
    }
  }

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
              Assign Questions
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Use the tray for multi-search selection, or assign the whole current visible result set in one click.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Visible Results
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {visibleQuestionPool.length}
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
            {submitting ? "Assigning Tray..." : "Assign Selected Tray"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleAssignAllVisible()}
            disabled={visibleSelectableQuestionIds.length === 0 || assigningVisible}
            className="rounded-xl border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {assigningVisible ? "Assigning Visible..." : "Assign All Visible"}
          </button>

          <button
            type="button"
            onClick={allVisibleSelected ? clearVisibleSelection : selectAllVisible}
            disabled={visibleSelectableQuestionIds.length === 0}
            className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {allVisibleSelected ? "Clear Visible Selection" : "Add Visible To Tray"}
          </button>

          <button
            type="button"
            onClick={clearAllSelection}
            disabled={selectedQuestionIds.length === 0}
            className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear Full Tray
          </button>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Default marks are set to +1 and -0.25 for fast MCQ paper building, but you can still change them before assigning.
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Selected Questions Tray
              </h4>
              <p className="mt-1 text-xs text-slate-600">
                Selection survives across multiple searches and refreshes.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
              Tray Count: {selectedQuestionIds.length}
            </div>
          </div>

          {selectedQuestions.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">
              No selected questions yet. Search below and add results to the tray.
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
              Search active questions, keep selection across searches, and assign either the tray or the entire visible search result set.
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