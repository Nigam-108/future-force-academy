"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

type DeleteAssignedQuestionsResponse = {
  test: {
    id: string;
    title: string;
    slug: string;
    structureType: TestStructureType;
    totalQuestions?: number;
    totalMarks?: number;
  };
  deletedCount: number;
  remainingAssigned: number;
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

async function apiDelete<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
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
  const router = useRouter();

  const [assigned, setAssigned] = useState<AssignedQuestionItem[]>([]);
  const [assignedLoading, setAssignedLoading] = useState(true);
  const [rowAction, setRowAction] = useState<RowActionState>(null);

  const [questionPool, setQuestionPool] = useState<AvailableQuestion[]>([]);
  const [questionPoolLoading, setQuestionPoolLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [selectedQuestionMap, setSelectedQuestionMap] = useState<
    Record<string, AvailableQuestion>
  >({});

  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>([]);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string | null>(
    null
  );
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const [sectionId, setSectionId] = useState("");
  const [positiveMarks, setPositiveMarks] = useState(DEFAULT_POSITIVE_MARKS);
  const [negativeMarks, setNegativeMarks] = useState(DEFAULT_NEGATIVE_MARKS);
  const [submitting, setSubmitting] = useState(false);
  const [assigningVisible, setAssigningVisible] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const assignedQuestionIds = useMemo(
    () => new Set(assigned.map((item) => item.questionId)),
    [assigned]
  );

  const visibleQuestionPool = useMemo(
    () => questionPool.filter((item) => !assignedQuestionIds.has(item.id)),
    [questionPool, assignedQuestionIds]
  );

  const selectedQuestions = useMemo(() => {
    return selectedQuestionIds
      .map((id) => selectedQuestionMap[id])
      .filter(Boolean);
  }, [selectedQuestionIds, selectedQuestionMap]);

  const visibleSelectableQuestionIds = useMemo(
    () => visibleQuestionPool.map((item) => item.id),
    [visibleQuestionPool]
  );

  const allVisibleSelected =
    visibleSelectableQuestionIds.length > 0 &&
    visibleSelectableQuestionIds.every((id) => selectedQuestionIds.includes(id));

  const allAssignedSelected =
    assigned.length > 0 && assigned.every((item) => selectedAssignmentIds.includes(item.id));

  function clearFeedback() {
    setErrorMessage(null);
    setSuccessMessage(null);
    setDeleteSuccessMessage(null);
  }

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

  function clearAllSelection() {
    clearFeedback();
    setSelectedQuestionIds([]);
    setSelectedQuestionMap({});
  }

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

  function toggleAssignedSelection(assignmentId: string) {
    clearFeedback();

    setSelectedAssignmentIds((previous) =>
      previous.includes(assignmentId)
        ? previous.filter((id) => id !== assignmentId)
        : [...previous, assignmentId]
    );
  }

  function toggleSelectAllAssigned() {
    clearFeedback();

    if (allAssignedSelected) {
      setSelectedAssignmentIds([]);
      return;
    }

    setSelectedAssignmentIds(assigned.map((item) => item.id));
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

      setSelectedAssignmentIds((previous) =>
        previous.filter((assignmentId) =>
          response.data?.items.some((item) => item.id === assignmentId)
        )
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load assigned questions."
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

      const response = await apiPost<unknown>(
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
        error instanceof Error ? error.message : "Failed to assign questions to test."
      );
    } finally {
      setSubmitting(false);
    }
  }

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

      const response = await apiPost<unknown>(
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
        throw new Error(response.message || "Failed to remove assigned question row.");
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

  async function handleDeleteSelectedAssigned() {
    if (selectedAssignmentIds.length === 0) {
      setErrorMessage("Select at least one assigned question first.");
      return;
    }

    const confirmed = window.confirm(
      `Delete ${selectedAssignmentIds.length} selected assigned question(s) from this test?\n\nOnly test assignments will be removed. Question bank records will remain safe.`
    );

    if (!confirmed) {
      return;
    }

    setIsDeletingSelected(true);
    clearFeedback();

    try {
      const response = await apiDelete<DeleteAssignedQuestionsResponse>(
        `/api/admin/tests/${testId}/questions`,
        {
          mode: "selected",
          assignmentIds: selectedAssignmentIds,
        }
      );

      if (!response.success || !response.data) {
        throw new Error(
          response.message || "Failed to delete selected assigned questions."
        );
      }

      setSelectedAssignmentIds([]);
      setDeleteSuccessMessage(
        `${response.data.deletedCount} selected assigned question(s) were removed from this test.`
      );

      await loadAssigned();
      await loadQuestionPool(appliedSearch);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete selected assigned questions."
      );
    } finally {
      setIsDeletingSelected(false);
    }
  }

  async function handleDeleteAllAssigned() {
    if (assigned.length === 0) {
      setErrorMessage("No assigned questions are available to delete.");
      return;
    }

    const confirmed = window.confirm(
      `Delete ALL assigned questions from "${testTitle}"?\n\nThis will remove only test assignments, not question bank records.`
    );

    if (!confirmed) {
      return;
    }

    setIsDeletingAll(true);
    clearFeedback();

    try {
      const response = await apiDelete<DeleteAssignedQuestionsResponse>(
        `/api/admin/tests/${testId}/questions`,
        {
          mode: "all",
        }
      );

      if (!response.success || !response.data) {
        throw new Error(
          response.message || "Failed to delete all assigned questions."
        );
      }

      setSelectedAssignmentIds([]);
      setDeleteSuccessMessage(
        `${response.data.deletedCount} assigned question(s) were removed from this test.`
      );

      await loadAssigned();
      await loadQuestionPool(appliedSearch);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete all assigned questions."
      );
    } finally {
      setIsDeletingAll(false);
    }
  }

  return (
    <div className="space-y-6">
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

      {deleteSuccessMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <p>{deleteSuccessMessage}</p>

          {assigned.length === 0 ? (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => router.push(`/admin/tests/${testId}/edit`)}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Back to Edit Test
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <section className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Assignment Console
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              {testTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Structure: {structureType} • Question order is randomized automatically on the backend.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="rounded-2xl border bg-slate-50 px-4 py-3 text-center">
              <p className="text-xs font-medium text-slate-500">Currently Assigned</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{assigned.length}</p>
            </div>

            <div className="rounded-2xl border bg-slate-50 px-4 py-3 text-center">
              <p className="text-xs font-medium text-slate-500">Selected In Tray</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {selectedQuestionIds.length}
              </p>
            </div>
          </div>
        </div>

        {structureType === "SECTIONAL" ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-800">Sections</h3>

            {sections.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">
                No sections found for this sectional test yet.
              </p>
            ) : (
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className="rounded-2xl border border-slate-200 bg-white p-3"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {section.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Order {section.displayOrder} • {section.totalQuestions} questions
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1 space-y-2">
            <label className="text-sm font-semibold text-slate-800">
              Search Question Bank
            </label>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search active questions..."
              className="w-full rounded-2xl border px-4 py-3"
            />
          </div>

          <button
            type="button"
            onClick={handleSearch}
            className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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
            className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Reset
          </button>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-2xl border p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Available Questions
                </h3>
                <p className="text-xs text-slate-500">
                  Already-assigned questions are automatically hidden here.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllVisible}
                  disabled={visibleQuestionPool.length === 0 || allVisibleSelected}
                  className="rounded-xl border px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Select All Visible
                </button>

                <button
                  type="button"
                  onClick={clearVisibleSelection}
                  disabled={visibleSelectableQuestionIds.length === 0}
                  className="rounded-xl border px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear Visible
                </button>
              </div>
            </div>

            {questionPoolLoading ? (
              <p className="text-sm text-slate-500">Loading question bank...</p>
            ) : visibleQuestionPool.length === 0 ? (
              <p className="text-sm text-slate-500">
                No visible active questions found for the current search.
              </p>
            ) : (
              <div className="space-y-3">
                {visibleQuestionPool.map((question) => {
                  const isSelected = selectedQuestionIds.includes(question.id);

                  return (
                    <div
                      key={question.id}
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {truncateText(question.questionText, 180)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {question.type} • {question.difficulty} • {question.status}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleQuestionSelection(question)}
                          className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                            isSelected
                              ? "bg-slate-900 text-white"
                              : "border text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {isSelected ? "Selected" : "Select"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border p-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Selected Tray
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Selection stays across searches until you clear or assign.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {structureType === "SECTIONAL" ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Assign To Section
                  </label>
                  <select
                    value={sectionId}
                    onChange={(event) => setSectionId(event.target.value)}
                    className="w-full rounded-2xl border px-4 py-3"
                  >
                    <option value="">Select section</option>
                    {sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.title}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Positive Marks
                  </label>
                  <input
                    value={positiveMarks}
                    onChange={(event) => setPositiveMarks(event.target.value)}
                    className="w-full rounded-2xl border px-4 py-3"
                    type="number"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Negative Marks
                  </label>
                  <input
                    value={negativeMarks}
                    onChange={(event) => setNegativeMarks(event.target.value)}
                    className="w-full rounded-2xl border px-4 py-3"
                    type="number"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleAssignSelected}
                  disabled={selectedQuestionIds.length === 0 || submitting}
                  className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {submitting ? "Assigning..." : `Assign Selected (${selectedQuestionIds.length})`}
                </button>

                <button
                  type="button"
                  onClick={handleAssignAllVisible}
                  disabled={visibleSelectableQuestionIds.length === 0 || assigningVisible}
                  className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {assigningVisible
                    ? "Assigning Visible..."
                    : `Assign All Visible (${visibleSelectableQuestionIds.length})`}
                </button>

                <button
                  type="button"
                  onClick={clearAllSelection}
                  disabled={selectedQuestionIds.length === 0}
                  className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear Tray
                </button>
              </div>

              {selectedQuestions.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No questions selected yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedQuestions.map((question) => (
                    <div
                      key={question.id}
                      className="rounded-2xl border border-slate-200 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {truncateText(question.questionText, 120)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {question.type} • {question.difficulty}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeSelectedQuestion(question.id)}
                          className="text-xs font-semibold text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Assigned Questions
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Remove individual rows, bulk-delete selected assignments, or clear all assignments from this test.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDeleteSelectedAssigned}
              disabled={selectedAssignmentIds.length === 0 || isDeletingSelected}
              className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeletingSelected
                ? "Deleting Selected..."
                : `Delete Selected (${selectedAssignmentIds.length})`}
            </button>

            <button
              type="button"
              onClick={handleDeleteAllAssigned}
              disabled={assigned.length === 0 || isDeletingAll}
              className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeletingAll ? "Deleting All..." : "Delete All from This Test"}
            </button>

            <Link
              href={`/admin/tests/${testId}/edit`}
              className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Edit Test
            </Link>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          {assignedLoading ? (
            <p className="text-sm text-slate-500">Loading assigned questions...</p>
          ) : assigned.length === 0 ? (
            <p className="text-sm text-slate-500">
              No questions are assigned to this test yet.
            </p>
          ) : (
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={allAssignedSelected}
                      onChange={toggleSelectAllAssigned}
                      aria-label="Select all assigned questions"
                    />
                  </th>
                  <th className="px-3 py-2">Order</th>
                  <th className="px-3 py-2">Question</th>
                  <th className="px-3 py-2">Section</th>
                  <th className="px-3 py-2">Marks</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>

              <tbody>
                {assigned.map((item) => (
                  <tr key={item.id} className="rounded-2xl border bg-slate-50">
                    <td className="px-3 py-3 align-top">
                      <input
                        type="checkbox"
                        checked={selectedAssignmentIds.includes(item.id)}
                        onChange={() => toggleAssignedSelection(item.id)}
                        aria-label={`Select assigned question ${item.id}`}
                      />
                    </td>

                    <td className="px-3 py-3 align-top text-sm font-medium text-slate-700">
                      {item.displayOrder}
                    </td>

                    <td className="px-3 py-3 align-top">
                      <p className="text-sm font-semibold text-slate-900">
                        {truncateText(item.question.questionText, 160)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.question.type} • {item.question.difficulty} • {item.question.status}
                      </p>
                    </td>

                    <td className="px-3 py-3 align-top text-sm text-slate-700">
                      {item.section ? item.section.title : "—"}
                    </td>

                    <td className="px-3 py-3 align-top text-sm text-slate-700">
                      +{item.positiveMarks ?? "—"} / -{item.negativeMarks ?? "—"}
                    </td>

                    <td className="px-3 py-3 align-top">
                      <button
                        type="button"
                        onClick={() => handleAssignedDelete(item.id)}
                        disabled={rowAction?.id === item.id}
                        className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {rowAction?.id === item.id ? "Removing..." : "Remove"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}