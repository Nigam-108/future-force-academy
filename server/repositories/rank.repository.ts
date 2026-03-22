import { prisma } from "@/server/db/prisma";

// ─── Get all userIds who have access to a specific batch ──────────────────────
// Includes both: admin-assigned (StudentBatch) + paid (Purchase)
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
  batchTitle: string
) {
  const myAttempt = await prisma.testAttempt.findUnique({
    where: { testId_userId: { testId, userId } },
    select: { totalMarksObtained: true, status: true },
  });

  if (!myAttempt || myAttempt.status !== "SUBMITTED") return null;

  const myScore = myAttempt.totalMarksObtained ?? 0;

  // All userIds who are members of this batch
  const memberIds = await getBatchMemberIds(batchId);

  // Count how many scored HIGHER than me (they rank above me)
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
    rank: higherCount + 1,      // my rank = people above me + 1
    totalAttempted,
    myScore,
  };
}

// ─── Get ranks for ALL batches a student is in for a specific test ────────────
// Returns array because student can be in multiple batches (show each separately)
export async function getRanksForStudentTest(
  userId: string,
  testId: string
): Promise<Array<{
  batchId: string;
  batchTitle: string;
  rank: number;
  totalAttempted: number;
  myScore: number;
}>> {
  // Get all batches this test is linked to
  const testBatches = await prisma.testBatch.findMany({
    where: { testId },
    select: {
      batchId: true,
      batch: { select: { id: true, title: true } },
    },
  });

  // Global test — no batch rank to show
  if (testBatches.length === 0) return [];

  const batchIds = testBatches.map((tb) => tb.batchId);

  // Find which of those batches THIS student is actually in
  const [userStudentBatches, userPurchases] = await Promise.all([
    prisma.studentBatch.findMany({
      where: { studentId: userId, batchId: { in: batchIds } },
      select: { batchId: true },
    }),
    prisma.purchase.findMany({
      where: { userId, batchId: { in: batchIds }, status: "ACTIVE" },
      select: { batchId: true },
    }),
  ]);

  const userBatchIds = new Set<string>();
  userStudentBatches.forEach((sb) => userBatchIds.add(sb.batchId));
  userPurchases.forEach((p) => userBatchIds.add(p.batchId));

  // Only calculate rank for batches this student belongs to
  const relevantBatches = testBatches.filter((tb) =>
    userBatchIds.has(tb.batchId)
  );

  const rankResults = await Promise.all(
    relevantBatches.map((tb) =>
      calculateRankInBatch(userId, testId, tb.batchId, tb.batch.title)
    )
  );

  // Filter out nulls (shouldn't happen but safety)
  return rankResults.filter(
    (r): r is NonNullable<typeof r> => r !== null
  );
}