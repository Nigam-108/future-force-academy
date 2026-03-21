import { AttemptStatus, Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

/**
 * Fetches a test before starting an attempt.
 *
 * Includes:
 * - assigned test questions in display order
 * - sections in display order
 *
 * Why:
 * The start-attempt flow needs the assigned testQuestion IDs
 * to create placeholder attempt-answer rows.
 */
/**
 * Fetches a test before starting an attempt.
 * Now includes testBatches so the service can enforce batch access.
 */
/**
 * Fetches a test before starting an attempt.
 *
 * Now includes both StudentBatch and Purchase data
 * so the service can enforce access via either path.
 */
/**
 * Fetches a test before starting an attempt.
 *
 * Only returns batch ID and status — the full access check
 * is delegated to access.service.ts / studentHasTestAccess().
 */
export async function findTestForAttemptStart(testId: string) {
  return prisma.test.findUnique({
    where: { id: testId },
    include: {
      testQuestions: {
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
          questionId: true,
          sectionId: true,
          displayOrder: true,
          positiveMarks: true,
          negativeMarks: true,
        },
      },
      sections: {
        orderBy: { displayOrder: "asc" },
      },
      testBatches: {
        select: {
          batchId: true,
          batch: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Finds the unique attempt for a given (testId, userId) pair.
 *
 * Important:
 * The schema already enforces @@unique([testId, userId]).
 */
export async function findAttemptByTestAndUser(testId: string, userId: string) {
  return prisma.testAttempt.findUnique({
    where: {
      testId_userId: {
        testId,
        userId,
      },
    },
    include: {
      answers: {
        orderBy: { createdAt: "asc" },
      },
      test: true,
    },
  });
}

/**
 * Creates a new attempt and placeholder answer rows in a transaction.
 *
 * Important:
 * If two concurrent start requests arrive, create() may throw a Prisma P2002
 * unique error because another request may have just created the attempt.
 * The service layer handles that gracefully.
 */
export async function createAttemptWithAnswerPlaceholders(data: {
  testId: string;
  userId: string;
  testQuestionIds: string[];
}) {
  return prisma.$transaction(async (tx) => {
    const attempt = await tx.testAttempt.create({
      data: {
        testId: data.testId,
        userId: data.userId,
        status: AttemptStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });

    if (data.testQuestionIds.length > 0) {
      await tx.attemptAnswer.createMany({
        data: data.testQuestionIds.map((testQuestionId) => ({
          attemptId: attempt.id,
          testQuestionId,
        })),
      });
    }

    return tx.testAttempt.findUnique({
      where: { id: attempt.id },
      include: {
        answers: {
          orderBy: { createdAt: "asc" },
        },
        test: {
          include: {
            sections: {
              orderBy: { displayOrder: "asc" },
            },
            _count: {
              select: {
                testQuestions: true,
              },
            },
          },
        },
      },
    });
  });
}

/**
 * Prisma known-request helper for unique constraint collisions.
 */
export function isAttemptUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

/**
 * Lightweight fetch of an attempt owned by the user.
 *
 * Used by:
 * - save answer flow
 * - fallback lookups
 */
export async function findAttemptByIdForUser(attemptId: string, userId: string) {
  return prisma.testAttempt.findFirst({
    where: {
      id: attemptId,
      userId,
    },
    include: {
      test: true,
      answers: true,
    },
  });
}

/**
 * Full attempt-view fetch for the student attempt player.
 *
 * Includes everything needed by the frontend:
 * - test metadata
 * - sections
 * - answers
 * - each answer's testQuestion
 * - each linked question
 * - each linked section
 */
export async function findAttemptViewByIdForUser(
  attemptId: string,
  userId: string
) {
  return prisma.testAttempt.findFirst({
    where: {
      id: attemptId,
      userId,
    },
    include: {
      test: {
        include: {
          sections: {
            orderBy: { displayOrder: "asc" },
          },
          _count: {
            select: {
              testQuestions: true,
            },
          },
        },
      },
      answers: {
        include: {
          testQuestion: {
            include: {
              question: true,
              section: true,
            },
          },
        },
        orderBy: {
          testQuestion: {
            displayOrder: "asc",
          },
        },
      },
    },
  });
}

export async function findTestQuestionByIdAndTest(
  testQuestionId: string,
  testId: string
) {
  return prisma.testQuestion.findFirst({
    where: {
      id: testQuestionId,
      testId,
    },
    include: {
      question: true,
      section: true,
    },
  });
}

export async function updateAttemptAnswerRecord(params: {
  attemptId: string;
  testQuestionId: string;
  selectedAnswer?: string | null;
  markedForReview?: boolean;
}) {
  const data: {
    selectedAnswer?: string | null;
    isAnswered?: boolean;
    markedForReview?: boolean;
  } = {};

  if (Object.prototype.hasOwnProperty.call(params, "selectedAnswer")) {
    const value = params.selectedAnswer?.trim() || null;
    data.selectedAnswer = value;
    data.isAnswered = Boolean(value);
  }

  if (typeof params.markedForReview === "boolean") {
    data.markedForReview = params.markedForReview;
  }

  return prisma.attemptAnswer.update({
    where: {
      attemptId_testQuestionId: {
        attemptId: params.attemptId,
        testQuestionId: params.testQuestionId,
      },
    },
    data,
    include: {
      testQuestion: {
        include: {
          question: true,
        },
      },
    },
  });
}

export async function findAttemptForSubmission(
  attemptId: string,
  userId: string
) {
  return prisma.testAttempt.findFirst({
    where: {
      id: attemptId,
      userId,
    },
    include: {
      test: true,
      answers: {
        orderBy: { createdAt: "asc" },
        include: {
          testQuestion: {
            include: {
              question: true,
              section: true,
            },
          },
        },
      },
    },
  });
}

export async function finalizeAttemptWithResult(params: {
  attemptId: string;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  totalMarksObtained: number;
  percentage: number;
  answerResults: Array<{
    answerId: string;
    isCorrect: boolean | null;
  }>;
}) {
  return prisma.$transaction(async (tx) => {
    for (const answerResult of params.answerResults) {
      await tx.attemptAnswer.update({
        where: { id: answerResult.answerId },
        data: { isCorrect: answerResult.isCorrect },
      });
    }

    return tx.testAttempt.update({
      where: { id: params.attemptId },
      data: {
        status: AttemptStatus.SUBMITTED,
        submittedAt: new Date(),
        correctCount: params.correctCount,
        wrongCount: params.wrongCount,
        unansweredCount: params.unansweredCount,
        totalMarksObtained: params.totalMarksObtained,
        percentage: params.percentage,
      },
      include: {
        test: true,
        answers: {
          orderBy: { createdAt: "asc" },
          include: {
            testQuestion: {
              include: {
                question: true,
                section: true,
              },
            },
          },
        },
      },
    });
  });
}

export async function findSubmittedAttemptResultForUser(
  attemptId: string,
  userId: string
) {
  return prisma.testAttempt.findFirst({
    where: {
      id: attemptId,
      userId,
      status: AttemptStatus.SUBMITTED,
    },
    include: {
      test: {
        include: {
          sections: {
            orderBy: { displayOrder: "asc" },
          },
        },
      },
      answers: {
        orderBy: { createdAt: "asc" },
        include: {
          testQuestion: {
            include: {
              question: true,
              section: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Checks whether a student has batch access to a specific test.
 *
 * Rules:
 * - No TestBatch rows = global test, all students have access
 * - TestBatch rows exist = student must be in at least one linked batch
 *
 * Used by: startAttempt service to guard attempt creation.
 */
export async function checkStudentBatchAccessToTest(
  testId: string,
  userId: string
): Promise<boolean> {
  const test = await prisma.test.findUnique({
    where: { id: testId },
    select: {
      testBatches: {
        select: {
          batch: {
            select: {
              studentBatches: {
                where: { studentId: userId },
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });

  if (!test) return false;

  // Global test — no batch restrictions
  if (test.testBatches.length === 0) return true;

  // Batch-restricted — student must be in at least one linked batch
  return test.testBatches.some((tb) => tb.batch.studentBatches.length > 0);
}