import { prisma } from "@/server/db/prisma";
import { isPurchaseValid } from "@/server/repositories/payment.repository";

/**
 * Central access resolver — single source of truth for all access decisions.
 *
 * Access paths for a BATCH:
 * 1. StudentBatch record (admin manually assigned)
 * 2. ACTIVE Purchase with purchaseType = FULL_BATCH (paid enrollment)
 * 3. ACTIVE free batch (isPaid = false)
 *
 * Access paths for a specific TEST inside a batch:
 * 1. No batch links → always accessible
 * 2. Full batch access
 * 3. Active TestPurchase record for that test
 * 4. Test is free (price null/0) in a batch where student has any individual purchase
 * 5. Test belongs to an ACTIVE free batch (batch.isPaid = false)
 */

type BatchLink = {
  batchId: string;
  batch: {
    id: string;
    status: string;
    isPaid?: boolean | null;
  };
};

// ─── Batch-level access ───────────────────────────────────────────────────────

export async function studentHasBatchAccess(
  userId: string,
  batchId: string
): Promise<boolean> {
  const [studentBatch, batch, fullBatchPurchase] = await Promise.all([
    prisma.studentBatch.findUnique({
      where: {
        studentId_batchId: {
          studentId: userId,
          batchId,
        },
      },
      select: { id: true },
    }),

    prisma.batch.findUnique({
      where: { id: batchId },
      select: {
        id: true,
        status: true,
        isPaid: true,
      },
    }),

    prisma.purchase.findFirst({
      where: {
        userId,
        batchId,
        status: "ACTIVE",
        purchaseType: "FULL_BATCH",
      },
      select: {
        id: true,
        status: true,
        validUntil: true,
      },
    }),
  ]);

  // Admin manual enrollment
  if (studentBatch) return true;

  // Free active batch → accessible
  if (batch && batch.status === "ACTIVE" && batch.isPaid === false) {
    return true;
  }

  // Paid full-batch purchase
  if (fullBatchPurchase && isPurchaseValid(fullBatchPurchase)) {
    return true;
  }

  return false;
}

/**
 * Returns all batch IDs a student has FULL access to.
 * Includes:
 * - student batch assignments
 * - active paid full-batch purchases
 * - active free batches
 */
export async function getStudentAccessibleBatchIds(
  userId: string
): Promise<string[]> {
  const [studentBatches, fullBatchPurchases, activeFreeBatches] =
    await Promise.all([
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
        select: {
          batchId: true,
          status: true,
          validUntil: true,
        },
      }),

      prisma.batch.findMany({
        where: {
          status: "ACTIVE",
          isPaid: false,
        },
        select: { id: true },
      }),
    ]);

  const batchIds = new Set<string>();

  studentBatches.forEach((sb) => batchIds.add(sb.batchId));

  fullBatchPurchases.forEach((purchase) => {
    if (isPurchaseValid(purchase)) {
      batchIds.add(purchase.batchId);
    }
  });

  activeFreeBatches.forEach((batch) => batchIds.add(batch.id));

  return Array.from(batchIds);
}

// ─── Test-level access ────────────────────────────────────────────────────────

export async function studentHasTestAccess(
  userId: string,
  testId: string,
  batchLinks: BatchLink[]
): Promise<boolean> {
  // Condition 1: global test
  if (batchLinks.length === 0) return true;

  const activeBatchLinks = batchLinks.filter((tb) => tb.batch.status === "ACTIVE");
  const activeBatchIds = activeBatchLinks.map((tb) => tb.batchId);

  // All linked batches are closed
  if (activeBatchIds.length === 0) return false;

  // Condition 2: any ACTIVE free batch linked to this test
  if (activeBatchLinks.some((tb) => tb.batch.isPaid === false)) {
    return true;
  }

  // Condition 3: full batch access (manual enrollment OR paid purchase)
  const batchAccessChecks = await Promise.all(
    activeBatchIds.map((batchId) => studentHasBatchAccess(userId, batchId))
  );

  if (batchAccessChecks.some(Boolean)) return true;

  // Condition 4: individual test purchase
  const testPurchase = await prisma.testPurchase.findFirst({
    where: {
      userId,
      testId,
      batchId: { in: activeBatchIds },
      status: "ACTIVE",
    },
    select: {
      id: true,
      status: true,
      validUntil: true,
    },
  });

  if (testPurchase && isPurchaseValid(testPurchase)) return true;

  // Condition 5: test is free within a paid batch and student has any individual purchase in that batch
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
      select: {
        id: true,
        status: true,
        validUntil: true,
      },
    });

    if (anyIndividualPurchase && isPurchaseValid(anyIndividualPurchase)) {
      return true;
    }
  }

  return false;
}

// ─── Admin / debug helpers ────────────────────────────────────────────────────

export async function getStudentBatchAccessSummary(
  userId: string,
  batchId: string
) {
  const [studentBatch, batch, purchase, testPurchases] = await Promise.all([
    prisma.studentBatch.findUnique({
      where: {
        studentId_batchId: {
          studentId: userId,
          batchId,
        },
      },
      select: {
        id: true,
        assignedAt: true,
      },
    }),

    prisma.batch.findUnique({
      where: { id: batchId },
      select: {
        id: true,
        title: true,
        status: true,
        isPaid: true,
      },
    }),

    prisma.purchase.findUnique({
      where: {
        userId_batchId: {
          userId,
          batchId,
        },
      },
      select: {
        id: true,
        status: true,
        purchaseType: true,
        validFrom: true,
        validUntil: true,
        payment: {
          select: {
            gateway: true,
            amount: true,
            paidAt: true,
          },
        },
      },
    }),

    prisma.testPurchase.findMany({
      where: {
        userId,
        batchId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        testId: true,
        status: true,
        validUntil: true,
        test: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
  ]);

  const hasFreeBatchAccess =
    !!batch && batch.status === "ACTIVE" && batch.isPaid === false;

  const hasFullAccess =
    !!studentBatch ||
    hasFreeBatchAccess ||
    (!!purchase &&
      purchase.status === "ACTIVE" &&
      purchase.purchaseType === "FULL_BATCH" &&
      isPurchaseValid(purchase));

  const validIndividualAccess = testPurchases.some((item) =>
    isPurchaseValid(item)
  );

  return {
    hasAccess: hasFullAccess || validIndividualAccess,
    accessType: hasFullAccess
      ? ("FULL" as const)
      : validIndividualAccess
      ? ("INDIVIDUAL_TESTS" as const)
      : ("NONE" as const),
    accessPaths: {
      viaStudentBatch: !!studentBatch,
      viaFreeBatch: hasFreeBatchAccess,
      viaFullBatchPurchase:
        !!purchase &&
        purchase.status === "ACTIVE" &&
        purchase.purchaseType === "FULL_BATCH" &&
        isPurchaseValid(purchase),
      viaIndividualPurchase: validIndividualAccess,
    },
    studentBatch,
    batch,
    purchase,
    individualTestPurchases: testPurchases.filter((item) =>
      isPurchaseValid(item)
    ),
  };
}