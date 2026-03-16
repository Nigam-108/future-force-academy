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

type AssignmentDraftItem = {
  questionId: string;
  questionText: string;
  displayOrder: string;
  positiveMarks: string;
  negativeMarks: string;
  sectionId: string;
};

type Props = {
  testId: string;
  testTitle: string;
  structureType: TestStructureType;
  sections: TestSection[];
};

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

export function TestQuestionAssignmentClient({
  testId,
  testTitle,
  structureType,
  sections,
}: Props) {
  const [assigned, setAssigned] = useState<AssignedQuestionItem[]>([]);
  const [assignedLoading, setAssignedLoading] = useState(true);

  const [questionPool, setQuestionPool] = useState<AvailableQuestion[]>([]);
  const [questionPoolLoading, setQuestionPoolLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");

  const [draftItems, setDraftItems] = useState<AssignmentDraftItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const assignedQuestionIds = useMemo(
    () => new Set(assigned.map((item) => item.questionId)),
    [assigned]
  );

  const draftQuestionIds = useMemo(
    () => new Set(draftItems.map((item) => item.questionId)),
    [draftItems]
  );

  const highestDisplayOrder = useMemo(() => {
    const assignedMax = assigned.reduce(
      (max, item) => Math.max(max, item.displayOrder),
      0
    );

    const draftMax = draftItems.reduce((max, item) => {
      const numericValue = Number(item.displayOrder || 0);
      return Math.max(max, Number.isFinite(numericValue) ? numericValue : 0);
    }, 0);

    return Math.max(assignedMax, draftMax);
  }, [assigned, draftItems]);

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

  async function loadQuestionPool() {
    setQuestionPoolLoading(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "20");

      if (search.trim()) params.set("search", search.trim());
      if (typeFilter) params.set("type", typeFilter);
      if (difficultyFilter) params.set("difficulty", difficultyFilter);
      if (statusFilter) params.set("status", statusFilter);

      const response = await apiGet<QuestionPoolResponse>(
        `/api/admin/questions?${params.toString()}`
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to load question bank.");
      }

      setQuestionPool(response.data.items);
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
    void loadQuestionPool();
  }, []);

  function addToDraft(question: AvailableQuestion) {
    if (assignedQuestionIds.has(question.id)) {
      setErrorMessage("This question is already assigned to the test.");
      return;
    }

    if (draftQuestionIds.has(question.id)) {
      setErrorMessage("This question is already added in the current batch.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    setDraftItems((previous) => [
      ...previous,
      {
        questionId: question.id,
        questionText: question.questionText,
        displayOrder: String(highestDisplayOrder + 1),
        positiveMarks: "1",
        negativeMarks: "0",
        sectionId: "",
      },
    ]);
  }

  function removeDraftItem(questionId: string) {
    setDraftItems((previous) =>
      previous.filter((item) => item.questionId !== questionId)
    );
  }

  function updateDraftItem(
    questionId: string,
    patch: Partial<AssignmentDraftItem>
  ) {
    setDraftItems((previous) =>
      previous.map((item) =>
        item.questionId === questionId ? { ...item, ...patch } : item
      )
    );
  }

  async function handleAssignmentSubmit() {
    if (draftItems.length === 0) {
      setErrorMessage("Add at least one question to the batch first.");
      return;
    }

    if (structureType === "SECTIONAL" && sections.length === 0) {
      setErrorMessage(
        "This is a sectional test but no sections exist yet. Create sections first."
      );
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = {
        items: draftItems.map((item) => ({
          questionId: item.questionId,
          sectionId: structureType === "SECTIONAL" ? item.sectionId || null : null,
          displayOrder: Number(item.displayOrder),
          positiveMarks:
            item.positiveMarks.trim() === ""
              ? null
              : Number(item.positiveMarks),
          negativeMarks:
            item.negativeMarks.trim() === ""
              ? null
              : Number(item.negativeMarks),
        })),
      };

      const response = await apiPost<AssignedQuestionsResponse>(
        `/api/admin/tests/${testId}/questions`,
        payload
      );

      if (!response.success) {
        throw new Error(
          response.message || "Failed to assign questions to test."
        );
      }

      setSuccessMessage("Questions assigned successfully.");
      setDraftItems([]);
      await loadAssigned();
      await loadQuestionPool();
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

      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
              Assignment Console
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              {testTitle}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Structure: <span className="font-semibold">{structureType}</span>
            </p>
          </div>

          <div className="rounded-2xl border bg-slate-50 px-4 py-3 text-right">
            <div className="text-xs text-slate-500">Currently Assigned</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">
              {assigned.length}
            </div>
          </div>
        </div>

        {structureType === "SECTIONAL" ? (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-slate-900">Sections</h3>

            {sections.length === 0 ? (
              <p className="mt-2 text-sm text-amber-700">
                No sections found for this sectional test yet.
              </p>
            ) : (
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className="rounded-2xl border bg-slate-50 p-4"
                  >
                    <div className="text-sm font-semibold text-slate-900">
                      {section.title}
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      Order {section.displayOrder} • {section.totalQuestions} questions
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
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
              <p className="mt-4 text-sm text-slate-600">Loading assigned questions...</p>
            ) : assigned.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">
                No questions are assigned to this test yet.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {assigned.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                          #{item.displayOrder} — {truncateText(item.question.questionText, 160)}
                        </h4>
                        <p className="mt-1 text-xs text-slate-600">
                          {item.question.type} • {item.question.difficulty} • Correct:{" "}
                          {item.question.correctAnswer || "—"}
                        </p>
                      </div>

                      <div className="text-right text-xs text-slate-600">
                        <div>+{item.positiveMarks ?? "—"}</div>
                        <div>-{item.negativeMarks ?? "—"}</div>
                      </div>
                    </div>

                    {item.section ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Section: {item.section.title}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Question Bank
              </h3>

              <button
                type="button"
                onClick={() => void loadQuestionPool()}
                className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Search / Refresh
              </button>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl border px-4 py-3 lg:col-span-2"
                placeholder="Search question text"
              />

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-xl border px-4 py-3"
              >
                <option value="">All Types</option>
                <option value="SINGLE_CORRECT">Single Correct</option>
                <option value="MULTI_CORRECT">Multi Correct</option>
                <option value="TRUE_FALSE">True / False</option>
                <option value="ASSERTION_REASON">Assertion Reason</option>
                <option value="MATCH_THE_FOLLOWING">Match the Following</option>
              </select>

              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="rounded-xl border px-4 py-3"
              >
                <option value="">All Difficulty</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border px-4 py-3"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="APPROVED">Approved</option>
                <option value="DRAFT">Draft</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {questionPoolLoading ? (
              <p className="mt-4 text-sm text-slate-600">Loading question bank...</p>
            ) : questionPool.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">
                No questions matched the current filters.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {questionPool.map((question) => {
                  const alreadyAssigned = assignedQuestionIds.has(question.id);
                  const alreadyQueued = draftQuestionIds.has(question.id);

                  return (
                    <article
                      key={question.id}
                      className="rounded-2xl border bg-slate-50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">
                            {truncateText(question.questionText)}
                          </h4>
                          <p className="mt-1 text-xs text-slate-600">
                            {question.type} • {question.difficulty} • {question.status}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => addToDraft(question)}
                          disabled={alreadyAssigned || alreadyQueued}
                          className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {alreadyAssigned
                            ? "Already Assigned"
                            : alreadyQueued
                            ? "Added"
                            : "Add"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-3xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Assignment Batch
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Build the next batch of question assignments and submit them together.
          </p>

          {draftItems.length === 0 ? (
            <p className="mt-5 text-sm text-slate-600">
              No questions added yet.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {draftItems.map((item) => (
                <article
                  key={item.questionId}
                  className="rounded-2xl border bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-sm font-semibold text-slate-900">
                      {truncateText(item.questionText, 120)}
                    </h4>

                    <button
                      type="button"
                      onClick={() => removeDraftItem(item.questionId)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <input
                      type="number"
                      min="1"
                      value={item.displayOrder}
                      onChange={(e) =>
                        updateDraftItem(item.questionId, {
                          displayOrder: e.target.value,
                        })
                      }
                      className="rounded-xl border px-3 py-2.5 text-sm"
                      placeholder="Display Order"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        min="0"
                        step="0.25"
                        value={item.positiveMarks}
                        onChange={(e) =>
                          updateDraftItem(item.questionId, {
                            positiveMarks: e.target.value,
                          })
                        }
                        className="rounded-xl border px-3 py-2.5 text-sm"
                        placeholder="Positive Marks"
                      />

                      <input
                        type="number"
                        min="0"
                        step="0.25"
                        value={item.negativeMarks}
                        onChange={(e) =>
                          updateDraftItem(item.questionId, {
                            negativeMarks: e.target.value,
                          })
                        }
                        className="rounded-xl border px-3 py-2.5 text-sm"
                        placeholder="Negative Marks"
                      />
                    </div>

                    {structureType === "SECTIONAL" ? (
                      <select
                        value={item.sectionId}
                        onChange={(e) =>
                          updateDraftItem(item.questionId, {
                            sectionId: e.target.value,
                          })
                        }
                        className="rounded-xl border px-3 py-2.5 text-sm"
                      >
                        <option value="">Select Section</option>
                        {sections.map((section) => (
                          <option key={section.id} value={section.id}>
                            {section.title}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleAssignmentSubmit()}
              disabled={draftItems.length === 0 || submitting}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {submitting ? "Assigning..." : "Assign Questions"}
            </button>

            <button
              type="button"
              onClick={() => {
                setDraftItems([]);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              disabled={draftItems.length === 0 || submitting}
              className="rounded-xl border px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Clear Batch
            </button>
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Current backend supports adding new assignments. Removing or editing
            existing assigned rows can be added in the next batch.
          </p>
        </aside>
      </section>
    </div>
  );
}