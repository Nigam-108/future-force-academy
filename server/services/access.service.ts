import { prisma } from "@/server/db/prisma";

/**
 * Central access resolver for batch-based test visibility.
 *
 * A student has access to a batch if they have EITHER:
 * 1. A StudentBatch record (admin manually assigned them)
 * 2. An ACTIVE Purchase record for that batch (paid or manually enrolled)
 *
 * This is the single source of truth for access decisions.
 * All access checks across the platform should use these functions.
 */

/**
 * Checks if a student has access to a specific batch.
 */
export async function studentHasBatchAccess(
  userId: string,
  batchId: string
): Promise<boolean> {
  const [studentBatch, purchase] = await Promise.all([
    // Path 1: Admin manual assignment
    prisma.studentBatch.findUnique({
      where: {
        studentId_batchId: { studentId: userId, batchId },
      },
      select: { id: true },
    }),
    // Path 2: Active purchase / enrollment
    prisma.purchase.findUnique({
      where: {
        userId_batchId: { userId, batchId },
      },
      select: { id: true, status: true },
    }),
  ]);

  if (studentBatch) return true;
  if (purchase && purchase.status === "ACTIVE") return true;

  return false;
}

/**
 * Returns all batch IDs a student currently has access to.
 * Used for batch-aware test listing.
 */
export async function getStudentAccessibleBatchIds(
  userId: string
): Promise<string[]> {
  const [studentBatches, activePurchases] = await Promise.all([
    prisma.studentBatch.findMany({
      where: { studentId: userId },
      select: { batchId: true },
    }),
    prisma.purchase.findMany({
      where: {
        userId,
        status: "ACTIVE",
      },
      select: { batchId: true },
    }),
  ]);

  const batchIds = new Set<string>();

  studentBatches.forEach((sb) => batchIds.add(sb.batchId));
  activePurchases.forEach((p) => batchIds.add(p.batchId));

  return Array.from(batchIds);
}

/**
 * Returns a summary of how a student has access to a specific batch.
 * Useful for admin visibility and debugging.
 */
export async function getStudentBatchAccessSummary(
  userId: string,
  batchId: string
) {
  const [studentBatch, purchase] = await Promise.all([
    prisma.studentBatch.findUnique({
      where: { studentId_batchId: { studentId: userId, batchId } },
      select: { id: true, assignedAt: true },
    }),
    prisma.purchase.findUnique({
      where: { userId_batchId: { userId, batchId } },
      select: {
        id: true,
        status: true,
        validFrom: true,
        validUntil: true,
        payment: {
          select: { gateway: true, amount: true, paidAt: true },
        },
      },
    }),
  ]);

  const hasAccess =
    !!studentBatch || (!!purchase && purchase.status === "ACTIVE");

  return {
    hasAccess,
    accessPaths: {
      viaStudentBatch: !!studentBatch,
      viaPurchase: !!purchase && purchase.status === "ACTIVE",
    },
    studentBatch,
    purchase,
  };
}