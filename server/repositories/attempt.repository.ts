import { AttemptStatus } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

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
    },
  });
}

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

export async function findAttemptByIdForUser(
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
      answers: true,
    },
  });
}

export async function findAttemptViewForUser(
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
            orderBy: {
              displayOrder: "asc",
            },
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
              section: true,
              question: true,
            },
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
        orderBy: {
          createdAt: "asc",
        },
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
        where: {
          id: answerResult.answerId,
        },
        data: {
          isCorrect: answerResult.isCorrect,
        },
      });
    }

    return tx.testAttempt.update({
      where: {
        id: params.attemptId,
      },
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