import { prisma } from "@/server/db/prisma";

export type CreateAttemptRepositoryInput = {
  testId: string;
  userId: string;
  startedAt: Date;
  unansweredCount: number;
};

const attemptSelect = {
  id: true,
  testId: true,
  userId: true,
  startedAt: true,
  submittedAt: true,
  totalMarksObtained: true,
  correctCount: true,
  wrongCount: true,
  unansweredCount: true,
  percentage: true,
  rank: true,
  createdAt: true,
  updatedAt: true,
} as const;

class AttemptRepository {
  async findExistingByTestAndUser(testId: string, userId: string) {
    return prisma.testAttempt.findFirst({
      where: {
        testId,
        userId,
      },
      select: attemptSelect,
    });
  }

  async createStartAttempt(data: CreateAttemptRepositoryInput) {
    return prisma.testAttempt.create({
      data: {
        testId: data.testId,
        userId: data.userId,
        startedAt: data.startedAt,
        totalMarksObtained: 0,
        correctCount: 0,
        wrongCount: 0,
        unansweredCount: data.unansweredCount,
        percentage: 0,
      },
      select: attemptSelect,
    });
  }
}

export const attemptRepository = new AttemptRepository();