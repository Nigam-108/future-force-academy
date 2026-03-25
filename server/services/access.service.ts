import { prisma } from "@/server/db/prisma";
import {
  isPurchaseValid,
  isTestPurchaseValid,
} from "@/server/repositories/payment.repository";

type BatchLink = {
  batchId: string;
  batch: {
    id: string;
    status: string;
  };
};

export async function studentHasBatchAccess(
  userId: string,
  batchId: string
): Promise<boolean> {
  const [studentBatch, fullBatchPurchase] = await Promise.all([
    prisma.studentBatch.findUnique({
      where: {
        studentId_batchId: {
          studentId: userId,
          batchId,
        },
      },
      select: {
        id: true,
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
        validFrom: true,
        validUntil: true,
      },
    }),
  ]);

  if (studentBatch) return true;
  if (fullBatchPurchase && isPurchaseValid(fullBatchPurchase)) return true;

  return false;
}

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
      select: {
        batchId: true,
        status: true,
        validFrom: true,
        validUntil: true,
      },
    }),
  ]);

  const batchIds = new Set<string>();

  studentBatches.forEach((membership) => {
    batchIds.add(membership.batchId);
  });

  fullBatchPurchases.forEach((purchase) => {
    if (isPurchaseValid(purchase)) {
      batchIds.add(purchase.batchId);
    }
  });

  return Array.from(batchIds);
}

export async function studentHasTestAccess(
  userId: string,
  testId: string,
  batchLinks: BatchLink[]
): Promise<boolean> {
  if (batchLinks.length === 0) return true;

  const activeBatchIds = batchLinks
    .filter((tb) => tb.batch.status === "ACTIVE")
    .map((tb) => tb.batchId);

  if (activeBatchIds.length === 0) return false;

  const batchAccessChecks = await Promise.all(
    activeBatchIds.map((batchId) => studentHasBatchAccess(userId, batchId))
  );

  if (batchAccessChecks.some(Boolean)) return true;

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
      validFrom: true,
      validUntil: true,
    },
  });

  if (testPurchase && isTestPurchaseValid(testPurchase)) {
    return true;
  }

  const freeTestBatch = await prisma.testBatch.findFirst({
    where: {
      testId,
      batchId: { in: activeBatchIds },
      OR: [{ price: null }, { price: 0 }],
    },
    select: {
      batchId: true,
    },
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
        validFrom: true,
        validUntil: true,
      },
    });

    if (anyIndividualPurchase && isTestPurchaseValid(anyIndividualPurchase)) {
      return true;
    }
  }

  return false;
}

export async function getStudentBatchAccessSummary(
  userId: string,
  batchId: string
) {
  const [studentBatch, purchase, testPurchases] = await Promise.all([
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
        validFrom: true,
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

  const hasFullAccess =
    !!studentBatch ||
    (!!purchase &&
      purchase.purchaseType === "FULL_BATCH" &&
      isPurchaseValid(purchase));

  const validIndividualTestPurchases = testPurchases.filter((item) =>
    isTestPurchaseValid(item)
  );

  const hasIndividualAccess = validIndividualTestPurchases.length > 0;

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
        purchase.purchaseType === "FULL_BATCH" &&
        isPurchaseValid(purchase),
      viaIndividualPurchase: hasIndividualAccess,
    },
    studentBatch,
    purchase,
    individualTestPurchases: validIndividualTestPurchases,
  };
}