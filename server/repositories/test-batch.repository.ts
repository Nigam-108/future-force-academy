import { prisma } from "@/server/db/prisma";

const batchSelect = {
  id: true,
  title: true,
  slug: true,
  examType: true,
  status: true,
  isPaid: true,
} as const;

/**
 * Returns all batch assignments for one test.
 */
export async function findTestBatchAssignments(testId: string) {
  return prisma.testBatch.findMany({
    where: { testId },
    include: {
      batch: { select: batchSelect },
    },
    orderBy: { assignedAt: "asc" },
  });
}

/**
 * Replaces all batch assignments for one test atomically.
 *
 * Empty batchIds = removes all restrictions (global test).
 */
export async function replaceTestBatchAssignments(
  testId: string,
  batchIds: string[]
) {
  return prisma.$transaction(async (tx) => {
    await tx.testBatch.deleteMany({ where: { testId } });

    if (batchIds.length > 0) {
      await tx.testBatch.createMany({
        data: batchIds.map((batchId) => ({ testId, batchId })),
      });
    }

    return tx.testBatch.findMany({
      where: { testId },
      include: { batch: { select: batchSelect } },
      orderBy: { assignedAt: "asc" },
    });
  });
}