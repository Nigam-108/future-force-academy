import { prisma } from "@/server/db/prisma";

/**
 * Central access resolver — single source of truth for all access decisions.
 *
 * Access paths for a BATCH:
 *   1. StudentBatch record (admin manually assigned)
 *   2. ACTIVE Purchase with purchaseType = FULL_BATCH (paid enrollment)
 *
 * Access paths for a specific TEST inside a batch:
 *   1. Full batch access (either of the above)
 *   2. TestPurchase record for that specific test (individual purchase)
 *   3. Test is free (price=null/0 in TestBatch) AND student has any
 *      individual TestPurchase in that batch
 */

// ─── Batch-level access ───────────────────────────────────────────────────────

/**
 * Checks if a student has FULL batch access.
 *
 * NOTE: INDIVIDUAL_TESTS purchases do NOT grant full batch access —
 * they only grant access to specific tests via TestPurchase records.
 */
export async function studentHasBatchAccess(
  userId: string,
  batchId: string
): Promise<boolean> {
  const [studentBatch, fullBatchPurchase] = await Promise.all([
    // Path 1: Admin manual assignment
    prisma.studentBatch.findUnique({
      where: { studentId_batchId: { studentId: userId, batchId } },
      select: { id: true },
    }),
    // Path 2: Active FULL_BATCH purchase only
    prisma.purchase.findFirst({
      where: {
        userId,
        batchId,
        status: "ACTIVE",
        purchaseType: "FULL_BATCH",
      },
      select: { id: true },
    }),
  ]);

  if (studentBatch) return true;
  if (fullBatchPurchase) return true;

  return false;
}

/**
 * Returns all batch IDs a student has FULL access to.
 * Does NOT include batches only accessible via individual test purchases.
 */
export async function getStudentAccessibleBatchIds(
  userId: string
): Promise<string[]> {
  const [studentBatches, fullBatchPurchases] = await Promise.all([
    prisma.studentBatch.findMany({
      where: { studentId: userId },
      select: { batchId: true },
    }),
    prisma.purchase.findMany({
      where: {
        userId,
        status: "ACTIVE",
        purchaseType: "FULL_BATCH",
      },
      select: { batchId: true },
    }),
  ]);

  const batchIds = new Set<string>();
  studentBatches.forEach((sb) => batchIds.add(sb.batchId));
  fullBatchPurchases.forEach((p) => batchIds.add(p.batchId));

  return Array.from(batchIds);
}

// ─── Test-level access ────────────────────────────────────────────────────────

type BatchLink = {
  batchId: string;
  batch: { id: string; status: string };
};

/**
 * Checks if a student can access a specific test.
 *
 * Access is granted if ANY of these conditions are true:
 *   1. No batch links (global test) → always accessible
 *   2. Full batch access (StudentBatch OR FULL_BATCH Purchase) for any active batch
 *   3. Active TestPurchase record for this specific test
 *   4. Test is free (price=null/0) in a batch where student has any
 *      individual TestPurchase
 */
export async function studentHasTestAccess(
  userId: string,
  testId: string,
  batchLinks: BatchLink[]
): Promise<boolean> {
  // Condition 1: No batch restrictions — global test
  if (batchLinks.length === 0) return true;

  const activeBatchIds = batchLinks
    .filter((tb) => tb.batch.status === "ACTIVE")
    .map((tb) => tb.batchId);

  // All linked batches are closed/draft
  if (activeBatchIds.length === 0) return false;

  // Condition 2: Full batch access (StudentBatch OR FULL_BATCH Purchase)
  const batchAccessChecks = await Promise.all(
    activeBatchIds.map((batchId) => studentHasBatchAccess(userId, batchId))
  );
  if (batchAccessChecks.some(Boolean)) return true;

  // Condition 3: Individual test purchase
  const testPurchase = await prisma.testPurchase.findFirst({
    where: {
      userId,
      testId,
      batchId: { in: activeBatchIds },
      status: "ACTIVE",
    },
    select: { id: true },
  });
  if (testPurchase) return true;

  // Condition 4: Test is free in a batch where student has individual purchases
  const freeTestBatch = await prisma.testBatch.findFirst({
    where: {
      testId,
      batchId: { in: activeBatchIds },
      OR: [{ price: null }, { price: 0 }],
    },
    select: { batchId: true },
  });

  if (freeTestBatch) {
    const anyIndividualPurchase = await prisma.testPurchase.findFirst({
      where: {
        userId,
        batchId: freeTestBatch.batchId,
        status: "ACTIVE",
      },
      select: { id: true },
    });
    if (anyIndividualPurchase) return true;
  }

  return false;
}

// ─── Admin / debug helpers ────────────────────────────────────────────────────

/**
 * Returns a full summary of how a student can access a specific batch.
 * Used by admin detail pages for visibility.
 */
export async function getStudentBatchAccessSummary(
  userId: string,
  batchId: string
) {
  const [studentBatch, purchase, testPurchases] = await Promise.all([
    prisma.studentBatch.findUnique({
      where: { studentId_batchId: { studentId: userId, batchId } },
      select: { id: true, assignedAt: true },
    }),
    prisma.purchase.findUnique({
      where: { userId_batchId: { userId, batchId } },
      select: {
        id: true,
        status: true,
        purchaseType: true,
        validFrom: true,
        validUntil: true,
        payment: {
          select: { gateway: true, amount: true, paidAt: true },
        },
      },
    }),
    prisma.testPurchase.findMany({
      where: { userId, batchId, status: "ACTIVE" },
      select: {
        id: true,
        testId: true,
        test: { select: { id: true, title: true } },
      },
    }),
  ]);

  const hasFullAccess =
    !!studentBatch ||
    (!!purchase &&
      purchase.status === "ACTIVE" &&
      purchase.purchaseType === "FULL_BATCH");

  const hasIndividualAccess = testPurchases.length > 0;

  return {
    hasAccess: hasFullAccess || hasIndividualAccess,
    accessType: hasFullAccess
      ? ("FULL" as const)
      : hasIndividualAccess
      ? ("INDIVIDUAL_TESTS" as const)
      : ("NONE" as const),
    accessPaths: {
      viaStudentBatch: !!studentBatch,
      viaFullBatchPurchase:
        !!purchase &&
        purchase.status === "ACTIVE" &&
        purchase.purchaseType === "FULL_BATCH",
      viaIndividualPurchase: hasIndividualAccess,
    },
    studentBatch,
    purchase,
    individualTestPurchases: testPurchases,
  };
}