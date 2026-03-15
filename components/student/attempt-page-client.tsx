"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type AttemptPageClientProps = {
  testId: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
  errors?: unknown;
};

type StartAttemptResponse = {
  resumed: boolean;
  attempt: {
    id: string;
    testId: string;
    status: string;
    startedAt: string | null;
  };
};

type AttemptViewResponse = {
  attempt: {
    id: string;
    testId: string;
    status: string;
    startedAt: string | null;
    submittedAt: string | null;
    title: string;
    slug: string;
    mode: string;
    structureType: string;
    totalQuestions: number;
    totalMarks: number;
    durationInMinutes: number | null;
  };
  sections: Array<{
    id: string;
    title: string;
    displayOrder: number;
    totalQuestions: number;
    durationInMinutes: number | null;
  }>;
  questions: Array<{
    answerId: string;
    testQuestionId: string;
    questionNumber: number;
    displayOrder: number;
    questionText: string;
    optionA: string | null;
    optionB: string | null;
    optionC: string | null;
    optionD: string | null;
    selectedAnswer: string | null;
    markedForReview: boolean;
    isAnswered: boolean;
    sectionTitle: string | null;
    positiveMarks: number | null;
    negativeMarks: number | null;
  }>;
};

type SaveAnswerResponse = {
  attemptId: string;
  testId: string;
  testQuestionId: string;
  answer: {
    id: string;
    selectedAnswer: string | null;
    markedForReview: boolean;
    isAnswered: boolean;
  };
};

function paletteClass(
  state: "current" | "attempted" | "review" | "default"
): string {
  if (state === "current") return "bg-blue-600 text-white border-blue-600";
  if (state === "attempted") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (state === "review") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-white text-slate-700 border-slate-200";
}

async function apiPost<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
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

async function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  const response = await fetch(path, {
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

export function AttemptPageClient({ testId }: AttemptPageClientProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);
  const [attemptData, setAttemptData] = useState<AttemptViewResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [busyQuestionId, setBusyQuestionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const autoSubmitTriggeredRef = useRef(false);

  const currentQuestion = attemptData?.questions[currentIndex] ?? null;

  async function loadAttemptView(attemptId: string) {
    const viewResponse = await apiGet<AttemptViewResponse>(
      `/api/attempts/view?attemptId=${encodeURIComponent(attemptId)}`
    );

    if (!viewResponse.success || !viewResponse.data) {
      throw new Error(viewResponse.message || "Failed to load attempt.");
    }

    setAttemptData(viewResponse.data);

    const duration = viewResponse.data.attempt.durationInMinutes ?? 0;
    const startedAt = viewResponse.data.attempt.startedAt
      ? new Date(viewResponse.data.attempt.startedAt).getTime()
      : Date.now();

    const expiresAt = startedAt + duration * 60 * 1000;
    const initialSecondsLeft = Math.max(
      Math.floor((expiresAt - Date.now()) / 1000),
      0
    );

    setSecondsLeft(initialSecondsLeft);
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        setLoading(true);
        setBootError(null);

        const startResponse = await apiPost<StartAttemptResponse>(
          "/api/attempts/start",
          { testId }
        );

        if (!startResponse.success || !startResponse.data) {
          throw new Error(startResponse.message || "Failed to start attempt.");
        }

        if (!cancelled) {
          await loadAttemptView(startResponse.data.attempt.id);
        }
      } catch (error) {
        if (!cancelled) {
          setBootError(
            error instanceof Error
              ? error.message
              : "Unable to start this test right now."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [testId]);

  useEffect(() => {
    if (secondsLeft === null) {
      return;
    }

    if (secondsLeft <= 0) {
      if (!autoSubmitTriggeredRef.current) {
        autoSubmitTriggeredRef.current = true;
        void handleSubmit(true);
      }
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((previous) => {
        if (previous === null) return null;
        return previous > 0 ? previous - 1 : 0;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [secondsLeft]);

  const answeredCount = useMemo(() => {
    return attemptData?.questions.filter((item) => Boolean(item.selectedAnswer))
      .length ?? 0;
  }, [attemptData]);

  const reviewCount = useMemo(() => {
    return attemptData?.questions.filter((item) => item.markedForReview).length ?? 0;
  }, [attemptData]);

  function formatTimer(totalSeconds: number | null) {
    if (totalSeconds === null) {
      return "--:--:--";
    }

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  }

  function getPaletteState(index: number) {
    if (!attemptData) {
      return "default" as const;
    }

    const item = attemptData.questions[index];

    if (index === currentIndex) {
      return "current" as const;
    }

    if (item.markedForReview) {
      return "review" as const;
    }

    if (item.selectedAnswer) {
      return "attempted" as const;
    }

    return "default" as const;
  }

  async function updateAnswer(params: {
    selectedAnswer?: string | null;
    markedForReview?: boolean;
  }) {
    if (!attemptData || !currentQuestion) {
      return;
    }

    setBusyQuestionId(currentQuestion.testQuestionId);

    try {
      const response = await apiPost<SaveAnswerResponse>("/api/attempts/save-answer", {
        attemptId: attemptData.attempt.id,
        testQuestionId: currentQuestion.testQuestionId,
        ...params,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to save answer.");
      }

      setAttemptData((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          questions: previous.questions.map((item) =>
            item.testQuestionId === currentQuestion.testQuestionId
              ? {
                  ...item,
                  ...(Object.prototype.hasOwnProperty.call(params, "selectedAnswer")
                    ? {
                        selectedAnswer: params.selectedAnswer ?? null,
                        isAnswered: Boolean(params.selectedAnswer),
                      }
                    : {}),
                  ...(typeof params.markedForReview === "boolean"
                    ? { markedForReview: params.markedForReview }
                    : {}),
                }
              : item
          ),
        };
      });
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to save answer."
      );
    } finally {
      setBusyQuestionId(null);
    }
  }

  async function handleSubmit(auto = false) {
    if (!attemptData || submitting) {
      return;
    }

    if (!auto) {
      const confirmed = window.confirm(
        "Submit this test now? Unanswered questions will remain unanswered."
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      setSubmitting(true);

      const response = await apiPost<{ id: string }>("/api/attempts/submit", {
        attemptId: attemptData.attempt.id,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to submit attempt.");
      }

      router.push(
        `/student/tests/${testId}/submitted?attemptId=${encodeURIComponent(
          attemptData.attempt.id
        )}`
      );
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to submit attempt."
      );
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Loading test…</h1>
          <p className="mt-2 text-sm text-slate-600">
            Starting or resuming your real attempt from the backend.
          </p>
        </div>
      </div>
    );
  }

  if (bootError || !attemptData || !currentQuestion) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <h1 className="text-lg font-semibold">Unable to open attempt</h1>
        <p className="mt-2 text-sm">
          {bootError || "Attempt data could not be loaded."}
        </p>
      </div>
    );
  }

  const optionEntries = [
    { key: "A", value: currentQuestion.optionA },
    { key: "B", value: currentQuestion.optionB },
    { key: "C", value: currentQuestion.optionC },
    { key: "D", value: currentQuestion.optionD },
  ].filter((item) => item.value && item.value.trim());

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
              Live Attempt
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              {attemptData.attempt.title}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Question {currentIndex + 1} of {attemptData.questions.length}
              {currentQuestion.sectionTitle
                ? ` • Section: ${currentQuestion.sectionTitle}`
                : ""}
            </p>
          </div>

          <div className="rounded-2xl border bg-slate-50 px-4 py-3 text-right">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Time Left
            </div>
            <div className="mt-1 text-2xl font-bold text-slate-900">
              {formatTimer(secondsLeft)}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border bg-slate-50 p-4">
            <div className="text-xs text-slate-500">Answered</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {answeredCount}
            </div>
          </div>

          <div className="rounded-2xl border bg-slate-50 p-4">
            <div className="text-xs text-slate-500">Marked for Review</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {reviewCount}
            </div>
          </div>

          <div className="rounded-2xl border bg-slate-50 p-4">
            <div className="text-xs text-slate-500">Total Marks</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {attemptData.attempt.totalMarks}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="mb-4 text-sm font-medium text-slate-500">
            Q{currentQuestion.questionNumber}
          </div>

          <h2 className="text-lg font-semibold leading-7 text-slate-900">
            {currentQuestion.questionText}
          </h2>

          <div className="mt-6 space-y-3">
            {optionEntries.map((option) => {
              const isSelected = currentQuestion.selectedAnswer === option.key;

              return (
                <label
                  key={option.key}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                    isSelected
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.testQuestionId}`}
                    checked={isSelected}
                    disabled={
                      busyQuestionId === currentQuestion.testQuestionId || submitting
                    }
                    onChange={() =>
                      void updateAnswer({
                        selectedAnswer: option.key,
                        markedForReview: currentQuestion.markedForReview,
                      })
                    }
                    className="mt-1"
                  />

                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {option.key}
                    </div>
                    <div className="mt-1 text-sm leading-6 text-slate-700">
                      {option.value}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((previous) => Math.max(previous - 1, 0))}
              className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Previous
            </button>

            <button
              type="button"
              disabled={
                busyQuestionId === currentQuestion.testQuestionId || submitting
              }
              onClick={() =>
                void updateAnswer({
                  markedForReview: !currentQuestion.markedForReview,
                  selectedAnswer: currentQuestion.selectedAnswer,
                })
              }
              className={`rounded-xl px-4 py-2.5 text-sm font-medium ${
                currentQuestion.markedForReview
                  ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                  : "border border-amber-300 text-amber-800 hover:bg-amber-50"
              }`}
            >
              {currentQuestion.markedForReview
                ? "Unmark Review"
                : "Mark for Review"}
            </button>

            <button
              type="button"
              disabled={
                currentIndex >= attemptData.questions.length - 1
              }
              onClick={() =>
                setCurrentIndex((previous) =>
                  Math.min(previous + 1, attemptData.questions.length - 1)
                )
              }
              className="rounded-xl border bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Next
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleSubmit(false)}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {submitting ? "Submitting..." : "Submit Test"}
            </button>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Selecting an option saves that answer immediately. Moving Next or
            Previous does not auto-save by itself.
          </p>
        </section>

        <aside className="rounded-3xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Question Palette</h3>
          <p className="mt-2 text-sm text-slate-600">
            Blue = Current, Green = Answered, Yellow = Review.
          </p>

          <div className="mt-5 grid grid-cols-5 gap-3">
            {attemptData.questions.map((item, index) => (
              <button
                key={item.testQuestionId}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold ${paletteClass(
                  getPaletteState(index)
                )}`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {attemptData.sections.length > 0 ? (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-slate-900">Sections</h4>
              <div className="mt-3 space-y-2">
                {attemptData.sections.map((section) => (
                  <div
                    key={section.id}
                    className="rounded-2xl border bg-slate-50 p-3"
                  >
                    <div className="text-sm font-medium text-slate-900">
                      {section.title}
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      {section.totalQuestions} questions
                      {section.durationInMinutes
                        ? ` • ${section.durationInMinutes} min`
                        : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}