import { prisma } from "@/server/db/prisma";

/**
 * Rank rules:
 *
 * Paid / enrolled batch:
 * - members = StudentBatch + active Purchase users
 * - only students who actually belong to that batch see that batch rank
 *
 * Free batch (isPaid = false):
 * - treat it as open access
 * - rank is calculated across all SUBMITTED attempts for that test
 * - any student who submitted that test can see that free-batch rank
 */

type RankResult = {
  batchId: string;
  batchTitle: string;
  rank: number;
  totalAttempted: number;
  myScore: number;
};

// ─── Get all member IDs for a PAID / enrolled batch ──────────────────────────
async function getBatchMemberIds(batchId: string): Promise<string[]> {
  const [studentBatches, purchases] = await Promise.all([
    prisma.studentBatch.findMany({
      where: { batchId },
      select: { studentId: true },
    }),
    prisma.purchase.findMany({
      where: { batchId, status: "ACTIVE" },
      select: { userId: true },
    }),
  ]);

  const ids = new Set<string>();
  studentBatches.forEach((sb) => ids.add(sb.studentId));
  purchases.forEach((p) => ids.add(p.userId));

  return Array.from(ids);
}

// ─── Calculate rank for one student in one test + one batch ──────────────────
export async function calculateRankInBatch(
  userId: string,
  testId: string,
  batchId: string,
  batchTitle: string,
  batchIsPaid: boolean
): Promise<RankResult | null> {
  const myAttempt = await prisma.testAttempt.findUnique({
    where: {
      testId_userId: { testId, userId },
    },
    select: {
      totalMarksObtained: true,
      status: true,
    },
  });

  if (!myAttempt || myAttempt.status !== "SUBMITTED") return null;

  const myScore = myAttempt.totalMarksObtained ?? 0;

  // Free batch → open rank across all submitted attempts for this test
  if (batchIsPaid === false) {
    const [higherCount, totalAttempted] = await Promise.all([
      prisma.testAttempt.count({
        where: {
          testId,
          status: "SUBMITTED",
          totalMarksObtained: { gt: myScore },
        },
      }),
      prisma.testAttempt.count({
        where: {
          testId,
          status: "SUBMITTED",
        },
      }),
    ]);

    return {
      batchId,
      batchTitle,
      rank: higherCount + 1,
      totalAttempted,
      myScore,
    };
  }

  // Paid / enrolled batch → rank only among actual batch members
  const memberIds = await getBatchMemberIds(batchId);

  if (memberIds.length === 0) {
    return {
      batchId,
      batchTitle,
      rank: 1,
      totalAttempted: 1,
      myScore,
    };
  }

  const [higherCount, totalAttempted] = await Promise.all([
    prisma.testAttempt.count({
      where: {
        testId,
        status: "SUBMITTED",
        userId: { in: memberIds },
        totalMarksObtained: { gt: myScore },
      },
    }),
    prisma.testAttempt.count({
      where: {
        testId,
        status: "SUBMITTED",
        userId: { in: memberIds },
      },
    }),
  ]);

  return {
    batchId,
    batchTitle,
    rank: higherCount + 1,
    totalAttempted,
    myScore,
  };
}

// ─── Get ranks for all relevant batches for a student's test ─────────────────
export async function getRanksForStudentTest(
  userId: string,
  testId: string
): Promise<RankResult[]> {
  // Get all batches this test is linked to
  const testBatches = await prisma.testBatch.findMany({
    where: { testId },
    select: {
      batchId: true,
      batch: {
        select: {
          id: true,
          title: true,
          isPaid: true,
          status: true,
        },
      },
    },
  });

  // Global test — no batch rank to show
  if (testBatches.length === 0) return [];

  const batchIds = testBatches.map((tb) => tb.batchId);

  // Find batch membership for paid/enrolled batches
  const [userStudentBatches, userPurchases] = await Promise.all([
    prisma.studentBatch.findMany({
      where: {
        studentId: userId,
        batchId: { in: batchIds },
      },
      select: { batchId: true },
    }),
    prisma.purchase.findMany({
      where: {
        userId,
        batchId: { in: batchIds },
        status: "ACTIVE",
      },
      select: { batchId: true },
    }),
  ]);

  const userBatchIds = new Set<string>();
  userStudentBatches.forEach((sb) => userBatchIds.add(sb.batchId));
  userPurchases.forEach((p) => userBatchIds.add(p.batchId));

  // IMPORTANT:
  // - free active batches are always relevant
  // - paid batches are relevant only if the student belongs to them
  const relevantBatches = testBatches.filter((tb) => {
    if (tb.batch.status !== "ACTIVE") return false;
    if (tb.batch.isPaid === false) return true;
    return userBatchIds.has(tb.batchId);
  });

  const rankResults = await Promise.all(
    relevantBatches.map((tb) =>
      calculateRankInBatch(
        userId,
        testId,
        tb.batchId,
        tb.batch.title,
        tb.batch.isPaid
      )
    )
  );

  return rankResults.filter((r): r is RankResult => r !== null);
}