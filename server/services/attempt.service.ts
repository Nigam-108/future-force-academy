import { AttemptStatus, TestMode, TestVisibilityStatus } from "@prisma/client";
import { AppError } from "@/server/utils/errors";
import {
  createAttemptWithAnswerPlaceholders,
  findAttemptByIdForUser,
  findAttemptByTestAndUser,
  findTestForAttemptStart,
  findTestQuestionByIdAndTest,
  updateAttemptAnswerRecord,
} from "@/server/repositories/attempt.repository";
import {
  SaveAnswerInput,
  StartAttemptInput,
} from "@/server/validations/attempt.schema";

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

  if ((test.mode === TestMode.LIVE || test.mode === TestMode.ASSIGNED) && test.startAt && now < test.startAt) {
    throw new AppError("This test is not live yet", 403);
  }

  if ((test.mode === TestMode.LIVE || test.mode === TestMode.ASSIGNED) && test.endAt && now > test.endAt) {
    throw new AppError("This test is no longer available", 403);
  }
}

export async function startAttempt(input: StartAttemptInput, userId: string) {
  const test = await findTestForAttemptStart(input.testId);

  if (!test) {
    throw new AppError("Test not found", 404);
  }

  assertTestAvailableForStudentStart(test);

  if (test.testQuestions.length === 0) {
    throw new AppError("This test has no assigned questions yet", 400);
  }

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

  const attempt = await createAttemptWithAnswerPlaceholders({
    testId: test.id,
    userId,
    testQuestionIds: test.testQuestions.map((item) => item.id),
  });

  return {
    resumed: false,
    attempt,
  };
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

  const testQuestion = await findTestQuestionByIdAndTest(input.testQuestionId, attempt.testId);

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