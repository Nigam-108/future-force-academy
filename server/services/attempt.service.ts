import {
  TestMode,
  TestVisibilityStatus,
} from "@prisma/client";

import { attemptRepository } from "@/server/repositories/attempt.repository";
import { testRepository } from "@/server/repositories/test.repository";
import type { StartAttemptInput } from "@/server/validations/attempt.schema";

type AttemptStartableTest = Awaited<
  ReturnType<typeof testRepository.findByIdForAttemptStart>
>;

type ExistingAttempt = Awaited<
  ReturnType<typeof attemptRepository.findExistingByTestAndUser>
>;

function ensureTestExists(
  test: AttemptStartableTest
): asserts test is NonNullable<AttemptStartableTest> {
  if (!test) {
    throw new Error("Test not found.");
  }
}

function canCreateNewAttempt(test: NonNullable<AttemptStartableTest>, now: Date) {
  if (test.visibilityStatus === TestVisibilityStatus.DRAFT) {
    throw new Error("This test is not available to students.");
  }

  if (test.visibilityStatus === TestVisibilityStatus.CLOSED) {
    throw new Error("This test is closed and cannot be started.");
  }

  if (test.mode === TestMode.LIVE) {
    if (!test.startAt || !test.endAt) {
      throw new Error("This live test is not configured correctly.");
    }

    if (now < test.startAt) {
      throw new Error("This test has not started yet.");
    }

    if (now > test.endAt) {
      throw new Error("This test window has ended.");
    }
  }
}

function isSubmittedAttempt(existingAttempt: ExistingAttempt) {
  return Boolean(existingAttempt?.submittedAt);
}

class AttemptService {
  async startAttempt(input: StartAttemptInput, userId: string) {
    const test = await testRepository.findByIdForAttemptStart(input.testId);
    ensureTestExists(test);

    const existingAttempt = await attemptRepository.findExistingByTestAndUser(
      input.testId,
      userId
    );

    if (existingAttempt) {
      if (isSubmittedAttempt(existingAttempt)) {
        throw new Error("This test has already been submitted.");
      }

      return {
        resumed: true,
        attempt: existingAttempt,
        test: {
          id: test.id,
          title: test.title,
          slug: test.slug,
          mode: test.mode,
          structureType: test.structureType,
          visibilityStatus: test.visibilityStatus,
          totalQuestions: test.totalQuestions,
          totalMarks: test.totalMarks,
          durationInMinutes: test.durationInMinutes,
          startAt: test.startAt,
          endAt: test.endAt,
        },
      };
    }

    const now = new Date();
    canCreateNewAttempt(test, now);

    const attempt = await attemptRepository.createStartAttempt({
      testId: test.id,
      userId,
      startedAt: now,
      unansweredCount: test.totalQuestions,
    });

    return {
      resumed: false,
      attempt,
      test: {
        id: test.id,
        title: test.title,
        slug: test.slug,
        mode: test.mode,
        structureType: test.structureType,
        visibilityStatus: test.visibilityStatus,
        totalQuestions: test.totalQuestions,
        totalMarks: test.totalMarks,
        durationInMinutes: test.durationInMinutes,
        startAt: test.startAt,
        endAt: test.endAt,
      },
    };
  }
}

export const attemptService = new AttemptService();