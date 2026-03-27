"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QuestionPalette } from "@/components/student/question-palette";
import { TestTimerBar } from "@/components/student/test-timer-bar";

type AttemptPageClientProps = { testId: string };

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
    allowSectionSwitching: boolean;
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
    sectionId: string | null;
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

type SectionGroup = {
  id: string;
  title: string;
  durationInMinutes: number | null;
  questionIndexes: number[];
  startQuestionNumber: number | null;
  endQuestionNumber: number | null;
  cumulativeStartSeconds: number;
  cumulativeEndSeconds: number;
};

async function apiPost<T>(
  path: string,
  body: unknown,
): Promise<ApiResponse<T>> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await response
    .json()
    .catch(() => null)) as ApiResponse<T> | null;
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
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const json = (await response
    .json()
    .catch(() => null)) as ApiResponse<T> | null;
  return {
    success: Boolean(json?.success),
    message: json?.message ?? "Request failed.",
    data: (json?.data ?? null) as T | null,
    errors: json?.errors,
  };
}

function formatTimer(totalSeconds: number | null) {
  if (totalSeconds === null) return "--:--:--";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
}

function buildSectionState(data: AttemptViewResponse | null) {
  if (!data) {
    return {
      groups: [] as SectionGroup[],
      questionSectionIndexes: [] as number[],
      hasMalformedAssignments: false,
    };
  }

  const sections = data.sections
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const sectionIndexById = new Map<string, number>();
  const sectionIndexByTitle = new Map<string, number>();

  sections.forEach((section, index) => {
    sectionIndexById.set(section.id, index);
    sectionIndexByTitle.set(section.title.trim().toLowerCase(), index);
  });

  const questionSectionIndexes = data.questions.map((question) => {
    if (question.sectionId && sectionIndexById.has(question.sectionId)) {
      return sectionIndexById.get(question.sectionId) ?? -1;
    }

    if (question.sectionTitle) {
      return (
        sectionIndexByTitle.get(question.sectionTitle.trim().toLowerCase()) ??
        -1
      );
    }

    return -1;
  });

  const hasMalformedAssignments =
    sections.length > 0 && questionSectionIndexes.some((index) => index < 0);

  let runningSeconds = 0;
  const groups = sections.map((section, sectionIndex) => {
    const questionIndexes = questionSectionIndexes
      .map((index, questionIndex) =>
        index === sectionIndex ? questionIndex : -1,
      )
      .filter((index) => index >= 0);

    const startQuestionNumber =
      questionIndexes.length > 0
        ? (data.questions[questionIndexes[0]]?.questionNumber ?? null)
        : null;
    const endQuestionNumber =
      questionIndexes.length > 0
        ? (data.questions[questionIndexes[questionIndexes.length - 1]]
            ?.questionNumber ?? null)
        : null;

    const cumulativeStartSeconds = runningSeconds;
    runningSeconds += Math.max((section.durationInMinutes ?? 0) * 60, 0);

    return {
      id: section.id,
      title: section.title,
      durationInMinutes: section.durationInMinutes,
      questionIndexes,
      startQuestionNumber,
      endQuestionNumber,
      cumulativeStartSeconds,
      cumulativeEndSeconds: runningSeconds,
    };
  });

  return { groups, questionSectionIndexes, hasMalformedAssignments };
}

function getTimedSectionIndex(groups: SectionGroup[], elapsedSeconds: number) {
  if (groups.length === 0) return 0;
  for (let index = 0; index < groups.length; index += 1) {
    if (elapsedSeconds < groups[index].cumulativeEndSeconds) return index;
  }
  return groups.length - 1;
}

export function AttemptPageClient({ testId }: AttemptPageClientProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);
  const [attemptData, setAttemptData] = useState<AttemptViewResponse | null>(
    null,
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [busyQuestionId, setBusyQuestionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [manualSectionIndex, setManualSectionIndex] = useState(0);
  const [sectionNotice, setSectionNotice] = useState<string | null>(null);

  const autoSubmitTriggeredRef = useRef(false);
  const timedSectionIndexRef = useRef<number | null>(null);
  const sectionNoticeTimeoutRef = useRef<number | null>(null);

  const currentQuestion = attemptData?.questions[currentIndex] ?? null;
  const {
    groups: sectionGroups,
    questionSectionIndexes,
    hasMalformedAssignments,
  } = useMemo(() => buildSectionState(attemptData), [attemptData]);

  const isSectionalTest =
    Boolean(attemptData) &&
    attemptData!.attempt.structureType === "SECTIONAL" &&
    sectionGroups.length > 0 &&
    !hasMalformedAssignments;
  const isSectionWiseTiming =
    isSectionalTest &&
    sectionGroups.some((group) => typeof group.durationInMinutes === "number");
  const allowFreeSectionSwitching =
    isSectionalTest &&
    !isSectionWiseTiming &&
    Boolean(attemptData?.attempt.allowSectionSwitching);

  const totalDurationSeconds = Math.max(
    (attemptData?.attempt.durationInMinutes ?? 0) * 60,
    0,
  );
  const elapsedSeconds =
    secondsLeft === null
      ? 0
      : Math.max(totalDurationSeconds - Math.max(secondsLeft, 0), 0);
  const timedSectionIndex = useMemo(
    () =>
      isSectionWiseTiming
        ? getTimedSectionIndex(sectionGroups, elapsedSeconds)
        : 0,
    [elapsedSeconds, isSectionWiseTiming, sectionGroups],
  );
  const currentQuestionSectionIndex = questionSectionIndexes[currentIndex] ?? 0;

  const effectiveSectionIndex = useMemo(() => {
    if (!isSectionalTest) return null;
    if (isSectionWiseTiming) return timedSectionIndex;
    if (allowFreeSectionSwitching)
      return Math.max(currentQuestionSectionIndex, 0);
    return Math.max(manualSectionIndex, 0);
  }, [
    allowFreeSectionSwitching,
    currentQuestionSectionIndex,
    isSectionWiseTiming,
    isSectionalTest,
    manualSectionIndex,
    timedSectionIndex,
  ]);

  const visibleQuestionIndexes = useMemo(() => {
    if (!attemptData) return [];
    if (
      !isSectionalTest ||
      allowFreeSectionSwitching ||
      effectiveSectionIndex === null
    ) {
      return attemptData.questions.map((_, index) => index);
    }
    return sectionGroups[effectiveSectionIndex]?.questionIndexes ?? [];
  }, [
    allowFreeSectionSwitching,
    attemptData,
    effectiveSectionIndex,
    isSectionalTest,
    sectionGroups,
  ]);

  const currentSectionGroup =
    effectiveSectionIndex !== null
      ? (sectionGroups[effectiveSectionIndex] ?? null)
      : null;

  const currentSectionSecondsLeft =
    isSectionWiseTiming && currentSectionGroup
      ? Math.max(currentSectionGroup.cumulativeEndSeconds - elapsedSeconds, 0)
      : null;

  const isOverallLowTime = secondsLeft !== null && secondsLeft <= 300;
  const isCurrentSectionLowTime =
    currentSectionSecondsLeft !== null && currentSectionSecondsLeft <= 300;

  const showSectionEndingWarning =
    isSectionWiseTiming &&
    currentSectionGroup !== null &&
    currentSectionSecondsLeft !== null &&
    currentSectionSecondsLeft > 0 &&
    currentSectionSecondsLeft <= 60;

  const answeredCount = useMemo(
    () =>
      attemptData?.questions.filter((item) => Boolean(item.selectedAnswer))
        .length ?? 0,
    [attemptData],
  );
  const reviewCount = useMemo(
    () =>
      attemptData?.questions.filter((item) => item.markedForReview).length ?? 0,
    [attemptData],
  );
  const unansweredCount = useMemo(
    () =>
      attemptData?.questions.filter((item) => !item.selectedAnswer).length ?? 0,
    [attemptData],
  );
  const paletteItems = useMemo(() => {
    if (!attemptData) return [];

    return visibleQuestionIndexes.map((index) => {
      const item = attemptData.questions[index];

      return {
        key: item.testQuestionId,
        number: item.questionNumber,
        state: getPaletteState(index),
      };
    });
  }, [attemptData, visibleQuestionIndexes, currentIndex]);

  function setTransientSectionNotice(message: string) {
    setSectionNotice(message);
    if (sectionNoticeTimeoutRef.current)
      window.clearTimeout(sectionNoticeTimeoutRef.current);
    sectionNoticeTimeoutRef.current = window.setTimeout(
      () => setSectionNotice(null),
      4000,
    );
  }

  async function loadAttemptView(attemptId: string) {
    const viewResponse = await apiGet<AttemptViewResponse>(
      `/api/attempts/view?attemptId=${encodeURIComponent(attemptId)}`,
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
    setSecondsLeft(Math.max(Math.floor((expiresAt - Date.now()) / 1000), 0));
    setCurrentIndex(0);
    setManualSectionIndex(0);
    timedSectionIndexRef.current = null;
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        setLoading(true);
        setBootError(null);
        const startResponse = await apiPost<StartAttemptResponse>(
          "/api/attempts/start",
          { testId },
        );
        if (!startResponse.success || !startResponse.data) {
          throw new Error(startResponse.message || "Failed to start attempt.");
        }
        if (!cancelled) await loadAttemptView(startResponse.data.attempt.id);
      } catch (error) {
        if (!cancelled) {
          setBootError(
            error instanceof Error
              ? error.message
              : "Unable to start this test right now.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
      if (sectionNoticeTimeoutRef.current)
        window.clearTimeout(sectionNoticeTimeoutRef.current);
    };
  }, [testId]);

  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      if (!autoSubmitTriggeredRef.current) {
        autoSubmitTriggeredRef.current = true;
        void handleSubmit(true);
      }
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((previous) =>
        previous === null ? null : previous > 0 ? previous - 1 : 0,
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  useEffect(() => {
    if (!attemptData || !isSectionalTest || allowFreeSectionSwitching) return;
    if (
      !visibleQuestionIndexes.includes(currentIndex) &&
      visibleQuestionIndexes.length > 0
    ) {
      setCurrentIndex(visibleQuestionIndexes[0]);
    }
  }, [
    allowFreeSectionSwitching,
    attemptData,
    currentIndex,
    isSectionalTest,
    visibleQuestionIndexes,
  ]);

  useEffect(() => {
    if (
      !attemptData ||
      !isSectionalTest ||
      isSectionWiseTiming ||
      allowFreeSectionSwitching
    )
      return;
    const nextManualSectionIndex = Math.max(
      questionSectionIndexes[currentIndex] ?? 0,
      0,
    );
    if (nextManualSectionIndex > manualSectionIndex)
      setManualSectionIndex(nextManualSectionIndex);
  }, [
    allowFreeSectionSwitching,
    attemptData,
    currentIndex,
    isSectionWiseTiming,
    isSectionalTest,
    manualSectionIndex,
    questionSectionIndexes,
  ]);

  useEffect(() => {
    if (!attemptData || !isSectionWiseTiming || !currentSectionGroup) return;

    const previousTimedSectionIndex = timedSectionIndexRef.current;
    if (previousTimedSectionIndex === null) {
      timedSectionIndexRef.current = timedSectionIndex;
      if (currentSectionGroup.questionIndexes[0] !== undefined) {
        setCurrentIndex(currentSectionGroup.questionIndexes[0]);
      }
      return;
    }
    if (previousTimedSectionIndex === timedSectionIndex) return;

    timedSectionIndexRef.current = timedSectionIndex;
    const nextGroup = sectionGroups[timedSectionIndex];
    const previousGroup = sectionGroups[previousTimedSectionIndex];
    void syncCurrentAnswerBeforeSectionTransition();
    if (nextGroup?.questionIndexes[0] !== undefined) {
      setCurrentIndex(nextGroup.questionIndexes[0]);
    }
    if (previousGroup && nextGroup) {
      setTransientSectionNotice(
        `Section "${previousGroup.title}" is locked. Moved automatically to "${nextGroup.title}".`,
      );
    }
  }, [
    attemptData,
    currentSectionGroup,
    isSectionWiseTiming,
    sectionGroups,
    timedSectionIndex,
  ]);

  async function updateAnswer(
    params: { selectedAnswer?: string | null; markedForReview?: boolean },
    questionOverride?: AttemptViewResponse["questions"][number],
  ) {
    const targetQuestion = questionOverride ?? currentQuestion;
    if (!attemptData || !targetQuestion) return false;

    setBusyQuestionId(targetQuestion.testQuestionId);
    setSaveStatus("saving");

    try {
      const response = await apiPost<SaveAnswerResponse>(
        "/api/attempts/save-answer",
        {
          attemptId: attemptData.attempt.id,
          testQuestionId: targetQuestion.testQuestionId,
          ...params,
        },
      );
      if (!response.success)
        throw new Error(response.message || "Failed to save answer.");

      setAttemptData((previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          questions: previous.questions.map((item) =>
            item.testQuestionId === targetQuestion.testQuestionId
              ? {
                  ...item,
                  ...(Object.prototype.hasOwnProperty.call(
                    params,
                    "selectedAnswer",
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
              : item,
          ),
        };
      });

      setSaveStatus("saved");
      window.setTimeout(() => {
        setSaveStatus((previous) => (previous === "saved" ? "idle" : previous));
      }, 1200);
      return true;
    } catch (error) {
      setSaveStatus("error");
      alert(error instanceof Error ? error.message : "Failed to save answer.");
      return false;
    } finally {
      setBusyQuestionId((previous) =>
        previous === targetQuestion.testQuestionId ? null : previous,
      );
    }
  }

  async function syncCurrentAnswerBeforeSectionTransition() {
    if (!currentQuestion) return;
    await updateAnswer(
      {
        selectedAnswer: currentQuestion.selectedAnswer,
        markedForReview: currentQuestion.markedForReview,
      },
      currentQuestion,
    );
  }

  function getPaletteState(index: number) {
    const item = attemptData?.questions[index];
    if (!item) return "default" as const;
    if (index === currentIndex) return "current" as const;
    if (item.markedForReview) return "review" as const;
    if (item.selectedAnswer) return "attempted" as const;
    return "default" as const;
  }

  function canAccessQuestionIndex(index: number) {
    if (!attemptData || index < 0 || index >= attemptData.questions.length)
      return false;
    if (
      !isSectionalTest ||
      allowFreeSectionSwitching ||
      effectiveSectionIndex === null
    )
      return true;
    return questionSectionIndexes[index] === effectiveSectionIndex;
  }

  function goToQuestion(index: number) {
    if (!canAccessQuestionIndex(index)) {
      setTransientSectionNotice(
        isSectionWiseTiming
          ? "Only the current timed section is available right now."
          : "You cannot reopen a previous section once you move ahead.",
      );
      return;
    }
    setCurrentIndex(index);
  }

  function jumpToFirstUnanswered() {
    if (!attemptData) return;
    const target = visibleQuestionIndexes.find(
      (index) => !attemptData.questions[index]?.selectedAnswer,
    );
    if (target !== undefined) setCurrentIndex(target);
  }

  function jumpToFirstReview() {
    if (!attemptData) return;
    const target = visibleQuestionIndexes.find(
      (index) => attemptData.questions[index]?.markedForReview,
    );
    if (target !== undefined) setCurrentIndex(target);
  }

  function handlePreviousQuestion() {
    if (!attemptData) return;
    if (!isSectionalTest || allowFreeSectionSwitching) {
      setCurrentIndex((previous) => Math.max(previous - 1, 0));
      return;
    }
    const currentVisiblePosition = visibleQuestionIndexes.indexOf(currentIndex);
    if (currentVisiblePosition > 0) {
      setCurrentIndex(visibleQuestionIndexes[currentVisiblePosition - 1]);
    }
  }

  async function handleNextQuestion() {
    if (!attemptData) return;
    if (!isSectionalTest || allowFreeSectionSwitching) {
      setCurrentIndex((previous) =>
        Math.min(previous + 1, attemptData.questions.length - 1),
      );
      return;
    }

    const currentVisiblePosition = visibleQuestionIndexes.indexOf(currentIndex);
    if (
      currentVisiblePosition >= 0 &&
      currentVisiblePosition < visibleQuestionIndexes.length - 1
    ) {
      setCurrentIndex(visibleQuestionIndexes[currentVisiblePosition + 1]);
      return;
    }

    if (
      !isSectionWiseTiming &&
      effectiveSectionIndex !== null &&
      effectiveSectionIndex < sectionGroups.length - 1
    ) {
      const nextSectionIndex = effectiveSectionIndex + 1;
      const nextSection = sectionGroups[nextSectionIndex];
      if (nextSection?.questionIndexes[0] !== undefined) {
        await syncCurrentAnswerBeforeSectionTransition();
        setManualSectionIndex(nextSectionIndex);
        setCurrentIndex(nextSection.questionIndexes[0]);
        setTransientSectionNotice(
          `Moved to "${nextSection.title}". Previous section is now locked.`,
        );
      }
    }
  }

  async function handleClearAnswer() {
    if (!currentQuestion) return;
    await updateAnswer({
      selectedAnswer: null,
      markedForReview: currentQuestion.markedForReview,
    });
  }

  async function handleSubmit(auto = false) {
    if (!attemptData || submitting) return;

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
        ].join("\n"),
      );
      if (!confirmed) return;
    }

    try {
      setSubmitting(true);
      const response = await apiPost<{ id: string }>("/api/attempts/submit", {
        attemptId: attemptData.attempt.id,
      });
      if (!response.success)
        throw new Error(response.message || "Failed to submit attempt.");
      router.push(
        `/student/tests/${testId}/submitted?attemptId=${encodeURIComponent(attemptData.attempt.id)}`,
      );
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to submit attempt.",
      );
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Loading test...
        </h1>
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

  const visibleIndexPosition = visibleQuestionIndexes.indexOf(currentIndex);
  const isPreviousDisabled =
    !isSectionalTest || allowFreeSectionSwitching
      ? currentIndex === 0
      : visibleIndexPosition <= 0;
  const isNextDisabled =
    !isSectionalTest || allowFreeSectionSwitching
      ? currentIndex === attemptData.questions.length - 1
      : !(
          visibleIndexPosition >= 0 &&
          visibleIndexPosition < visibleQuestionIndexes.length - 1
        ) &&
        !(
          !isSectionWiseTiming &&
          effectiveSectionIndex !== null &&
          effectiveSectionIndex < sectionGroups.length - 1
        );

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
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
              Question {currentQuestion.questionNumber} of{" "}
              {attemptData.questions.length}
              {currentSectionGroup
                ? ` • Section: ${currentSectionGroup.title}`
                : ""}
            </p>
          </div>

          <TestTimerBar
            overallSecondsLeft={secondsLeft}
            isOverallLowTime={isOverallLowTime}
            currentSectionTitle={currentSectionGroup?.title ?? null}
            currentSectionSecondsLeft={currentSectionSecondsLeft}
            isCurrentSectionLowTime={isCurrentSectionLowTime}
            showCurrentSectionTimer={Boolean(
              isSectionWiseTiming && currentSectionGroup,
            )}
            saveStatus={saveStatus}
            formatTimer={formatTimer}
          />
        </div>

        {sectionNotice ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {sectionNotice}
          </div>
        ) : null}

        {showSectionEndingWarning ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Warning: Section "{currentSectionGroup?.title}" will auto-switch in{" "}
            <span className="font-semibold">
              {formatTimer(currentSectionSecondsLeft)}
            </span>
            . Save/review your answer now.
          </div>
        ) : null}

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
                    <p className="mt-1 text-sm text-slate-700">
                      {option.value}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={isPreviousDisabled}
              onClick={handlePreviousQuestion}
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
              disabled={isNextDisabled}
              onClick={() => void handleNextQuestion()}
              className="rounded-xl border bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSectionalTest &&
              !allowFreeSectionSwitching &&
              !isSectionWiseTiming &&
              visibleIndexPosition === visibleQuestionIndexes.length - 1 &&
              effectiveSectionIndex !== null &&
              effectiveSectionIndex < sectionGroups.length - 1
                ? "Next Section"
                : "Next"}
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
            Selecting an option saves immediately. When section restrictions are
            active, only the current section stays open for navigation.
          </p>
        </div>
      </section>

      <aside className="space-y-6">
        <QuestionPalette
          items={paletteItems}
          onQuestionClick={(visibleIndex) => {
            const targetIndex = visibleQuestionIndexes[visibleIndex];
            if (targetIndex !== undefined) {
              goToQuestion(targetIndex);
            }
          }}
        />

        {sectionGroups.length > 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Sections</h3>
            <div className="mt-4 space-y-3">
              {sectionGroups.map((section, index) => {
                const isCurrent = effectiveSectionIndex === index;
                const isLocked =
                  !allowFreeSectionSwitching &&
                  effectiveSectionIndex !== null &&
                  index < effectiveSectionIndex;
                const isFuture =
                  !allowFreeSectionSwitching &&
                  effectiveSectionIndex !== null &&
                  index > effectiveSectionIndex;
                const sectionTimerLabel = isSectionWiseTiming
                  ? isCurrent
                    ? formatTimer(currentSectionSecondsLeft)
                    : isLocked
                      ? "Locked"
                      : section.durationInMinutes
                        ? `${section.durationInMinutes} min • Not Started`
                        : "Not Started"
                  : section.durationInMinutes
                    ? `${section.durationInMinutes} min`
                    : "Overall timer";

                const sectionTimerClass =
                  isSectionWiseTiming && isCurrent && isCurrentSectionLowTime
                    ? "text-red-600"
                    : "text-slate-700";

                return (
                  <div
                    key={section.id}
                    className={`rounded-2xl border p-4 ${
                      isCurrent
                        ? "border-blue-200 bg-blue-50"
                        : isLocked
                          ? "border-slate-200 bg-slate-100 text-slate-500"
                          : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {allowFreeSectionSwitching &&
                        section.questionIndexes[0] !== undefined ? (
                          <button
                            type="button"
                            onClick={() =>
                              goToQuestion(section.questionIndexes[0])
                            }
                            className="font-medium text-slate-900 hover:text-blue-700 hover:underline"
                          >
                            {section.title}
                          </button>
                        ) : (
                          <p className="font-medium text-slate-900">
                            {section.title}
                          </p>
                        )}

                        <p className="mt-1 text-xs text-slate-600">
                          {section.startQuestionNumber &&
                          section.endQuestionNumber
                            ? `Q${section.startQuestionNumber}-Q${section.endQuestionNumber}`
                            : "No assigned questions"}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                          isCurrent
                            ? "bg-blue-100 text-blue-700"
                            : isLocked
                              ? "bg-slate-200 text-slate-500"
                              : isFuture
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {isCurrent
                          ? "Current"
                          : isLocked
                            ? "Locked"
                            : isFuture
                              ? "Upcoming"
                              : "Open"}
                      </span>
                    </div>
                    <p className={`mt-2 text-sm ${sectionTimerClass}`}>
                      {sectionTimerLabel}
                    </p>
                    {allowFreeSectionSwitching &&
                    section.questionIndexes[0] !== undefined ? (
                      <button
                        type="button"
                        onClick={() => goToQuestion(section.questionIndexes[0])}
                        className="mt-3 rounded-xl border px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white"
                      >
                        Go to Section
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </aside>
    </div>
  );
}
