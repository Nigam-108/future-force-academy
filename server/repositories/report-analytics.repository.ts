import { AttemptStatus } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

/**
 * Fetches a test with all attempts required for analytics.
 *
 * Why:
 * - allows us to build admin-level performance summaries
 * - keeps analytics query logic isolated from service formatting logic
 */
export async function findTestAnalyticsById(testId: string) {
  return prisma.test.findUnique({
    where: { id: testId },
    include: {
      attempts: {
        orderBy: {
          startedAt: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Small helper used by service logic where needed.
 */
export const ATTEMPT_STATUS = {
  IN_PROGRESS: AttemptStatus.IN_PROGRESS,
  SUBMITTED: AttemptStatus.SUBMITTED,
} as const;