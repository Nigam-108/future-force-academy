import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

// ─── Batch pricing ────────────────────────────────────────────────────────────

export async function findBatchWithPricing(batchId: string) {
  return prisma.batch.findUnique({
    where: { id: batchId },
    select: {
      id: true,
      title: true,
      status: true,
      isPaid: true,
      price: true,
      originalPrice: true,
      offerEndDate: true,
    },
  });
}

export async function updateBatchPricingRecord(
  batchId: string,
  data: {
    price?: number | null;
    originalPrice?: number | null;
    offerEndDate?: Date | null;
  }
) {
  return prisma.batch.update({
    where: { id: batchId },
    data: {
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.originalPrice !== undefined
        ? { originalPrice: data.originalPrice }
        : {}),
      ...(data.offerEndDate !== undefined
        ? { offerEndDate: data.offerEndDate }
        : {}),
    },
    select: {
      id: true,
      title: true,
      price: true,
      originalPrice: true,
      offerEndDate: true,
    },
  });
}

// ─── TestBatch pricing ────────────────────────────────────────────────────────

export async function findTestBatchWithPrice(testId: string, batchId: string) {
  return prisma.testBatch.findUnique({
    where: { testId_batchId: { testId, batchId } },
    select: {
      id: true,
      testId: true,
      batchId: true,
      price: true,
      test: {
        select: { id: true, title: true, totalMarks: true, totalQuestions: true },
      },
    },
  });
}

export async function findTestBatchesWithPricesForBatch(batchId: string) {
  return prisma.testBatch.findMany({
    where: { batchId },
    select: {
      id: true,
      testId: true,
      price: true,
      test: {
        select: {
          id: true,
          title: true,
          slug: true,
          mode: true,
          visibilityStatus: true,
          totalQuestions: true,
          totalMarks: true,
          durationInMinutes: true,
        },
      },
    },
    orderBy: { assignedAt: "asc" },
  });
}

export async function updateTestBatchPriceRecord(
  testId: string,
  batchId: string,
  price: number | null
) {
  return prisma.testBatch.update({
    where: { testId_batchId: { testId, batchId } },
    data: { price },
    select: {
      id: true,
      testId: true,
      batchId: true,
      price: true,
    },
  });
}

// ─── TestPurchase ─────────────────────────────────────────────────────────────

export async function findTestPurchaseByUserAndTest(
  userId: string,
  testId: string
) {
  return prisma.testPurchase.findUnique({
    where: { userId_testId: { userId, testId } },
    select: { id: true, status: true, batchId: true },
  });
}

export async function findTestPurchasesByUserAndBatch(
  userId: string,
  batchId: string
) {
  return prisma.testPurchase.findMany({
    where: { userId, batchId, status: "ACTIVE" },
    select: { id: true, testId: true, status: true },
  });
}

export async function createTestPurchaseRecords(
  data: Array<{
    userId: string;
    testId: string;
    batchId: string;
    paymentId?: string;
  }>
) {
  return prisma.$transaction(
    data.map((item) =>
      prisma.testPurchase.upsert({
        where: { userId_testId: { userId: item.userId, testId: item.testId } },
        create: {
          userId: item.userId,
          testId: item.testId,
          batchId: item.batchId,
          paymentId: item.paymentId ?? null,
          status: "ACTIVE",
        },
        update: {
          status: "ACTIVE",
          paymentId: item.paymentId ?? null,
        },
      })
    )
  );
}

export async function getTestPurchaseStats(batchId?: string) {
  const where: Prisma.TestPurchaseWhereInput = {
    status: "ACTIVE",
    ...(batchId ? { batchId } : {}),
  };

  // Most purchased tests
  const testCounts = await prisma.testPurchase.groupBy({
    by: ["testId"],
    where,
    _count: { testId: true },
    orderBy: { _count: { testId: "desc" } },
    take: 10,
  });

  return { testCounts };
}