import { AttemptStatus, UserRole } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

export async function findStudentUserById(userId: string) {
  return prisma.user.findFirst({
    where: {
      id: userId,
      role: UserRole.STUDENT,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      mobileNumber: true,
      preferredLanguage: true,
      emailVerified: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateStudentUserById(
  userId: string,
  data: {
    fullName?: string;
    mobileNumber?: string | null;
    preferredLanguage?: "EN" | "GU" | "HI";
  }
) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      fullName: true,
      email: true,
      mobileNumber: true,
      preferredLanguage: true,
      emailVerified: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getStudentDashboardStats(userId: string) {
  const [totalAttempts, inProgressAttempts, submittedAttempts, recentAttempts] =
    await Promise.all([
      prisma.testAttempt.count({
        where: { userId },
      }),
      prisma.testAttempt.count({
        where: {
          userId,
          status: AttemptStatus.IN_PROGRESS,
        },
      }),
      prisma.testAttempt.count({
        where: {
          userId,
          status: AttemptStatus.SUBMITTED,
        },
      }),
      prisma.testAttempt.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          test: {
            select: {
              id: true,
              title: true,
              slug: true,
              mode: true,
              visibilityStatus: true,
              totalMarks: true,
            },
          },
        },
      }),
    ]);

  return {
    totalAttempts,
    inProgressAttempts,
    submittedAttempts,
    recentAttempts,
  };
}

export async function listStudentSubmittedResults(userId: string) {
  return prisma.testAttempt.findMany({
    where: {
      userId,
      status: AttemptStatus.SUBMITTED,
    },
    orderBy: { submittedAt: "desc" },
    include: {
      test: {
        select: {
          id: true,
          title: true,
          slug: true,
          mode: true,
          totalMarks: true,
        },
      },
    },
  });
}

export async function findStudentSubmittedResultById(userId: string, attemptId: string) {
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