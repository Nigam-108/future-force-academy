import { AttemptStatus, TestMode, TestVisibilityStatus } from "@prisma/client";
import { AppError } from "@/server/utils/errors";
import {
  createAttemptWithAnswerPlaceholders,
  finalizeAttemptWithResult,
  findAttemptByIdForUser,
  findAttemptByTestAndUser,
  findAttemptForSubmission,
  findSubmittedAttemptResultForUser,
  findTestForAttemptStart,
  findTestQuestionByIdAndTest,
  isAttemptUniqueConstraintError,
  updateAttemptAnswerRecord,
} from "@/server/repositories/attempt.repository";
import type {
  GetAttemptResultQueryInput,
  SaveAnswerInput,
  StartAttemptInput,
  SubmitAttemptInput,
} from "@/server/validations/attempt.schema";



/**
 * Ensures the test is currently available to a student.
 *
 * Rules:
 * - visibility must be LIVE
 * - for LIVE / ASSIGNED modes, start and end windows must be valid
 */
function assertTestAvailableForStudentStart(test: {
  visibilityStatus: TestVisibilityStatus;
  mode: TestMode;
  startAt: Date | null;
  endAt: Date | null;
}) {
  if (test.visibilityStatus !== TestVisibilityStatus.LIVE) {
    throw new AppError("This test is not available for students", 403);
  }

  const now = new Date();

  if (
    (test.mode === TestMode.LIVE || test.mode === TestMode.ASSIGNED) &&
    test.startAt &&
    now < test.startAt
  ) {
    throw new AppError("This test is not live yet", 403);
  }

  if (
    (test.mode === TestMode.LIVE || test.mode === TestMode.ASSIGNED) &&
    test.endAt &&
    now > test.endAt
  ) {
    throw new AppError("This test is no longer available", 403);
  }
}

/**
 * Normalizes answer letters for safe comparison.
 */
function normalizeAnswer(value: string | null | undefined) {
  return value?.trim().toUpperCase() || null;
}

/**
 * Starts or resumes an attempt for the student.
 *
 * Important improvement:
 * This function is now made idempotent for real-world race conditions.
 *
 * Why:
 * Sometimes the frontend can trigger the start request twice
 * (double click, re-render, hydration retry, React dev behavior, etc).
 * Instead of throwing a Prisma unique constraint error, we:
 * - try to create the attempt
 * - if a unique conflict happens, fetch the existing attempt
 * - return it as resumed
 */
export async function startAttempt(input: StartAttemptInput, userId: string) {
  const test = await findTestForAttemptStart(input.testId);

  if (!test) {
    throw new AppError("Test not found", 404);
  }

  assertTestAvailableForStudentStart(test);

  if (test.testQuestions.length === 0) {
    throw new AppError("This test has no assigned questions yet", 400);
  }

  /**
   * Fast path:
   * if the attempt already exists, return it directly.
   */
  const existingAttempt = await findAttemptByTestAndUser(test.id, userId);

  if (existingAttempt) {
    if (existingAttempt.status === AttemptStatus.IN_PROGRESS) {
      return {
        resumed: true,
        attempt: existingAttempt,
      };
    }

    throw new AppError("Attempt already completed for this test", 409);
  }

  /**
   * Create path:
   * try to create a new attempt and answer placeholders.
   */
  try {
    const attempt = await createAttemptWithAnswerPlaceholders({
      testId: test.id,
      userId,
      testQuestionIds: test.testQuestions.map((item) => item.id),
    });

    return {
      resumed: false,
      attempt,
    };
  } catch (error) {
    /**
     * Race-condition recovery path:
     * if another parallel request already created the attempt,
     * read it and return it safely instead of showing an error.
     */
    if (isAttemptUniqueConstraintError(error)) {
      const recoveredAttempt = await findAttemptByTestAndUser(test.id, userId);

      if (recoveredAttempt) {
        if (recoveredAttempt.status === AttemptStatus.IN_PROGRESS) {
          return {
            resumed: true,
            attempt: recoveredAttempt,
          };
        }

        throw new AppError("Attempt already completed for this test", 409);
      }
    }

    throw error;
  }
}

export async function saveAnswer(input: SaveAnswerInput, userId: string) {
  const attempt = await findAttemptByIdForUser(input.attemptId, userId);

  if (!attempt) {
    throw new AppError("Attempt not found", 404);
  }

  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    throw new AppError("Attempt is not active", 409);
  }

  const now = new Date();

  if (attempt.test.endAt && now > attempt.test.endAt) {
    throw new AppError("Attempt window has expired", 409);
  }

  const testQuestion = await findTestQuestionByIdAndTest(
    input.testQuestionId,
    attempt.testId
  );

  if (!testQuestion) {
    throw new AppError("Test question not found for this attempt", 404);
  }

  const answer = await updateAttemptAnswerRecord({
    attemptId: input.attemptId,
    testQuestionId: input.testQuestionId,
    ...(Object.prototype.hasOwnProperty.call(input, "selectedAnswer")
      ? { selectedAnswer: input.selectedAnswer ?? null }
      : {}),
    ...(typeof input.markedForReview === "boolean"
      ? { markedForReview: input.markedForReview }
      : {}),
  });

  return {
    attemptId: attempt.id,
    testId: attempt.testId,
    testQuestionId: testQuestion.id,
    answer,
  };
}

export async function submitAttempt(input: SubmitAttemptInput, userId: string) {
  const attempt = await findAttemptForSubmission(input.attemptId, userId);

  if (!attempt) {
    throw new AppError("Attempt not found", 404);
  }

  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    throw new AppError("Attempt is not active", 409);
  }

  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  let totalMarksObtained = 0;

  const answerResults = attempt.answers.map((answer) => {
    const selected = normalizeAnswer(answer.selectedAnswer);
    const correct = normalizeAnswer(answer.testQuestion.question.correctAnswer);

    if (!selected) {
      unansweredCount += 1;
      return {
        answerId: answer.id,
        isCorrect: null,
      };
    }

    if (selected === correct) {
      correctCount += 1;
      totalMarksObtained += answer.testQuestion.positiveMarks ?? 1;

      return {
        answerId: answer.id,
        isCorrect: true,
      };
    }

    wrongCount += 1;
    totalMarksObtained -= answer.testQuestion.negativeMarks ?? 0;

    return {
      answerId: answer.id,
      isCorrect: false,
    };
  });

  const safeTotalMarks =
    attempt.test.totalMarks && attempt.test.totalMarks > 0
      ? attempt.test.totalMarks
      : 0;

  const percentage =
    safeTotalMarks > 0
      ? Number(((totalMarksObtained / safeTotalMarks) * 100).toFixed(2))
      : 0;

  const finalizedAttempt = await finalizeAttemptWithResult({
    attemptId: attempt.id,
    correctCount,
    wrongCount,
    unansweredCount,
    totalMarksObtained,
    percentage,
    answerResults,
  });

  return finalizedAttempt;
}

export async function getAttemptResult(
  input: GetAttemptResultQueryInput,
  userId: string
) {
  const attempt = await findSubmittedAttemptResultForUser(input.attemptId, userId);

  if (!attempt) {
    throw new AppError("Submitted result not found", 404);
  }

  const answerReview = attempt.answers.map((answer, index) => ({
    answerId: answer.id,
    questionNumber: index + 1,
    questionText: answer.testQuestion.question.questionText,
    selectedAnswer: answer.selectedAnswer,
    correctAnswer: answer.testQuestion.question.correctAnswer,
    explanation: answer.testQuestion.question.explanation,
    isAnswered: answer.isAnswered,
    isCorrect: answer.isCorrect,
    markedForReview: answer.markedForReview,
    sectionTitle: answer.testQuestion.section?.title ?? null,
  }));

  return {
    summary: {
      attemptId: attempt.id,
      testId: attempt.testId,
      testTitle: attempt.test.title,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      totalMarksObtained: attempt.totalMarksObtained,
      correctCount: attempt.correctCount,
      wrongCount: attempt.wrongCount,
      unansweredCount: attempt.unansweredCount,
      percentage: attempt.percentage,
      rank: attempt.rank,
    },
    sections: attempt.test.sections,
    answerReview,
  };
}

/**
 * Returns the full in-progress attempt view for the student.
 *
 * Used by:
 * - the attempt player screen
 * - question navigation UI
 * - loading saved answers / marked-for-review state
 *
 * Important:
 * This only allows viewing attempts that belong to the current student
 * and are still IN_PROGRESS.
 *
 * Note:
 * In the current codebase, we reuse `findAttemptByIdForUser`
 * instead of a separate `findAttemptViewForUser` repository helper.
 */
export async function getAttemptView(
  input: { attemptId: string },
  userId: string
) {
  const attempt = await findAttemptByIdForUser(input.attemptId, userId);

  if (!attempt) {
    throw new AppError("Attempt not found", 404);
  }

  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    throw new AppError("Attempt is not active", 409);
  }

  /**
   * Since `findAttemptByIdForUser` returns only basic attempt + answers + test,
   * and not the fully nested `testQuestion.question` structure,
   * this lightweight version returns the attempt shell only.
   *
   * If your attempt player screen needs full question rendering,
   * then next we should upgrade the repository function include shape.
   */
  return {
    attempt: {
      id: attempt.id,
      testId: attempt.testId,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      title: attempt.test.title,
      slug: attempt.test.slug,
      mode: attempt.test.mode,
      structureType: attempt.test.structureType,
      totalQuestions: attempt.test.totalQuestions,
      totalMarks: attempt.test.totalMarks,
      durationInMinutes: attempt.test.durationInMinutes,
    },
    answers: attempt.answers.map((answer, index) => ({
      answerId: answer.id,
      testQuestionId: answer.testQuestionId,
      questionNumber: index + 1,
      selectedAnswer: answer.selectedAnswer,
      markedForReview: answer.markedForReview,
      isAnswered: answer.isAnswered,
      isCorrect: answer.isCorrect,
    })),
  };
}