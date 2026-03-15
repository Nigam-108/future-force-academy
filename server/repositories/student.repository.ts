import { AttemptStatus, UserRole, UserStatus } from "@prisma/client";
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

export async function listAdminStudents(filters: {
  page: number;
  limit: number;
  search?: string;
  status?: UserStatus;
}) {
  const where = {
    role: UserRole.STUDENT,
    ...(filters.search
      ? {
          OR: [
            { fullName: { contains: filters.search, mode: "insensitive" as const } },
            { email: { contains: filters.search, mode: "insensitive" as const } },
            { mobileNumber: { contains: filters.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(filters.status ? { status: filters.status } : {}),
  };

  const skip = (filters.page - 1) * filters.limit;

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: filters.limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobileNumber: true,
        preferredLanguage: true,
        emailVerified: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  };
}

export async function getAdminStudentById(studentId: string) {
  const student = await prisma.user.findFirst({
    where: {
      id: studentId,
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

  if (!student) {
    return null;
  }

  const [attempts, submittedAttemptsCount, inProgressAttemptsCount, totalAttemptsCount] = await Promise.all([
    prisma.testAttempt.findMany({
      where: { userId: studentId },
      orderBy: { createdAt: "desc" },
      take: 10,
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
    }),
    prisma.testAttempt.count({ where: { userId: studentId, status: AttemptStatus.SUBMITTED } }),
    prisma.testAttempt.count({ where: { userId: studentId, status: AttemptStatus.IN_PROGRESS } }),
    prisma.testAttempt.count({ where: { userId: studentId } }),
  ]);

  return {
    student,
    stats: {
      submittedAttemptsCount,
      inProgressAttemptsCount,
      totalAttempts: totalAttemptsCount,
    },
    recentAttempts: attempts,
  };
}

export async function updateStudentStatus(studentId: string, status: UserStatus) {
  return prisma.user.update({
    where: { id: studentId },
    data: { status },
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true,
      updatedAt: true,
    },
  });
}