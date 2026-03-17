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

/**
 * Palette color helper for question navigation buttons.
 *
 * Meanings:
 * - blue: current question
 * - green: answered
 * - yellow: review
 * - white: untouched/default
 */
function paletteClass(
  state: "current" | "attempted" | "review" | "default"
): string {
  if (state === "current") return "bg-blue-600 text-white border-blue-600";
  if (state === "attempted")
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (state === "review")
    return "bg-amber-100 text-amber-700 border-amber-200";

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

  const json = (await response.json().catch(() => null)) as
    | ApiResponse<T>
    | null;

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

  const json = (await response.json().catch(() => null)) as
    | ApiResponse<T>
    | null;

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

  /**
   * saveStatus gives the student confidence that actions are being persisted.
   *
   * States:
   * - idle
   * - saving
   * - saved
   * - error
   */
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const autoSubmitTriggeredRef = useRef(false);

  /**
   * Safe access to the current question.
   * Prevents runtime crash if attempt payload is malformed.
   */
  const currentQuestion = attemptData?.questions?.[currentIndex] ?? null;

  async function loadAttemptView(attemptId: string) {
    const viewResponse = await apiGet<AttemptViewResponse>(
      `/api/attempts/view?attemptId=${encodeURIComponent(attemptId)}`
    );

    if (!viewResponse.success || !viewResponse.data) {
      throw new Error(viewResponse.message || "Failed to load attempt.");
    }

    if (!Array.isArray(viewResponse.data.questions)) {
      throw new Error("Attempt view payload is missing questions.");
    }

    if (!Array.isArray(viewResponse.data.sections)) {
      throw new Error("Attempt view payload is missing sections.");
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
    setCurrentIndex(0);
  }

  /**
   * Boot flow:
   * - start/resume attempt
   * - then load full attempt view
   */
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

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [testId]);

  /**
   * Countdown timer.
   * Auto-submits once time reaches zero.
   */
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
    return (
      attemptData?.questions?.filter((item) => Boolean(item.selectedAnswer))
        .length ?? 0
    );
  }, [attemptData]);

  const reviewCount = useMemo(() => {
    return (
      attemptData?.questions?.filter((item) => item.markedForReview).length ?? 0
    );
  }, [attemptData]);

  const unansweredCount = useMemo(() => {
    return (
      attemptData?.questions?.filter((item) => !item.selectedAnswer).length ?? 0
    );
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
    if (!attemptData || !attemptData.questions[index]) {
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

  /**
   * Finds and jumps to the first unanswered question.
   */
  function jumpToFirstUnanswered() {
    if (!attemptData) return;

    const index = attemptData.questions.findIndex((item) => !item.selectedAnswer);

    if (index >= 0) {
      setCurrentIndex(index);
    }
  }

  /**
   * Finds and jumps to the first marked-for-review question.
   */
  function jumpToFirstReview() {
    if (!attemptData) return;

    const index = attemptData.questions.findIndex((item) => item.markedForReview);

    if (index >= 0) {
      setCurrentIndex(index);
    }
  }

  /**
   * Saves answer selection and/or review state.
   * Also updates top save-status indicator.
   */
  async function updateAnswer(params: {
    selectedAnswer?: string | null;
    markedForReview?: boolean;
  }) {
    if (!attemptData || !currentQuestion) {
      return;
    }

    setBusyQuestionId(currentQuestion.testQuestionId);
    setSaveStatus("saving");

    try {
      const response = await apiPost<SaveAnswerResponse>(
        "/api/attempts/save-answer",
        {
          attemptId: attemptData.attempt.id,
          testQuestionId: currentQuestion.testQuestionId,
          ...params,
        }
      );

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
                  ...(Object.prototype.hasOwnProperty.call(
                    params,
                    "selectedAnswer"
                  )
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

      setSaveStatus("saved");

      /**
       * Fade "saved" back to idle after a short time.
       */
      window.setTimeout(() => {
        setSaveStatus((previous) => (previous === "saved" ? "idle" : previous));
      }, 1200);
    } catch (error) {
      setSaveStatus("error");
      alert(error instanceof Error ? error.message : "Failed to save answer.");
    } finally {
      setBusyQuestionId(null);
    }
  }

  /**
   * Clears only the selected answer for the current question.
   * Review flag is preserved.
   */
  async function handleClearAnswer() {
    if (!currentQuestion) {
      return;
    }

    await updateAnswer({
      selectedAnswer: null,
      markedForReview: currentQuestion.markedForReview,
    });
  }

  /**
   * Submit handler.
   *
   * For manual submit:
   * - shows a summary confirmation first
   *
   * For auto submit:
   * - skips confirmation dialog
   */
  async function handleSubmit(auto = false) {
    if (!attemptData || submitting) {
      return;
    }

    if (!auto) {
      const confirmed = window.confirm(
        [
          "Submit this test now?",
          "",
          `Answered: ${answeredCount}`,
          `Unanswered: ${unansweredCount}`,
          `Marked for Review: ${reviewCount}`,
          "",
          "Unanswered questions will remain unanswered.",
        ].join("\n")
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
      alert(error instanceof Error ? error.message : "Failed to submit attempt.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Loading test…</h1>
        <p className="mt-2 text-sm text-slate-600">
          Starting or resuming your real attempt from the backend.
        </p>
      </div>
    );
  }

  if (bootError || !attemptData || !currentQuestion) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-rose-700">
        <h1 className="text-2xl font-semibold">Unable to open attempt</h1>
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
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
              Live Attempt
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">
              {attemptData.attempt.title}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Question {currentIndex + 1} of {attemptData.questions.length}
              {currentQuestion.sectionTitle
                ? ` • Section: ${currentQuestion.sectionTitle}`
                : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Time Left
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {formatTimer(secondsLeft)}
              </p>
            </div>

            <div
              className={`rounded-2xl border px-4 py-3 text-center text-sm font-medium ${
                saveStatus === "saving"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : saveStatus === "saved"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : saveStatus === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              {saveStatus === "saving"
                ? "Saving..."
                : saveStatus === "saved"
                ? "Saved"
                : saveStatus === "error"
                ? "Save Failed"
                : "Ready"}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Answered
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {answeredCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Marked for Review
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {reviewCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Unanswered
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {unansweredCount}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={jumpToFirstUnanswered}
            className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Jump to First Unanswered
          </button>

          <button
            type="button"
            onClick={jumpToFirstReview}
            className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Jump to First Review
          </button>
        </div>

        <div className="mt-8">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Q{currentQuestion.questionNumber}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">
            {currentQuestion.questionText}
          </h2>

          <div className="mt-6 space-y-3">
            {optionEntries.map((option) => {
              const isSelected = currentQuestion.selectedAnswer === option.key;

              return (
                <label
                  key={option.key}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.testQuestionId}`}
                    checked={isSelected}
                    disabled={busyQuestionId === currentQuestion.testQuestionId}
                    onChange={() =>
                      void updateAnswer({
                        selectedAnswer: option.key,
                        markedForReview: currentQuestion.markedForReview,
                      })
                    }
                    className="mt-1"
                  />

                  <div>
                    <span className="text-sm font-semibold text-slate-700">
                      {option.key}
                    </span>
                    <p className="mt-1 text-sm text-slate-700">{option.value}</p>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() =>
                setCurrentIndex((previous) => Math.max(previous - 1, 0))
              }
              className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Previous
            </button>

            <button
              type="button"
              onClick={() => void handleClearAnswer()}
              disabled={
                busyQuestionId === currentQuestion.testQuestionId ||
                !currentQuestion.selectedAnswer
              }
              className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Clear Answer
            </button>

            <button
              type="button"
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
              disabled={currentIndex === attemptData.questions.length - 1}
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

          <p className="mt-4 text-xs text-slate-500">
            Selecting an option saves immediately. You can also clear an answer,
            mark questions for review, and jump to unanswered questions quickly.
          </p>
        </div>
      </section>

      <aside className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Question Palette
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Blue = Current, Green = Answered, Yellow = Review.
          </p>

          <div className="mt-4 grid grid-cols-5 gap-2">
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
        </section>

        {attemptData.sections.length > 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Sections</h3>

            <div className="mt-4 space-y-3">
              {attemptData.sections.map((section) => (
                <div
                  key={section.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="font-medium text-slate-900">{section.title}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {section.totalQuestions} questions
                    {section.durationInMinutes
                      ? ` • ${section.durationInMinutes} min`
                      : ""}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </aside>
    </div>
  );
}