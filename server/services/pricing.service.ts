import { AppError } from "@/server/utils/errors";
import { prisma } from "@/server/db/prisma";
import {
  findBatchWithPricing,
  findTestBatchesWithPricesForBatch,
  findTestBatchWithPrice,
  findTestPurchasesByUserAndBatch,
  updateBatchPricingRecord,
  updateTestBatchPriceRecord,
  createTestPurchaseRecords,
  getTestPurchaseStats,
} from "@/server/repositories/pricing.repository";
import { formatAmountFromPaise } from "@/server/repositories/payment.repository";
import type { UpdateBatchPricingInput } from "@/server/validations/pricing.schema";

// ─── Admin pricing management ─────────────────────────────────────────────────

export async function getBatchPricing(batchId: string) {
  const batch = await findBatchWithPricing(batchId);
  if (!batch) throw new AppError("Batch not found", 404);

  const testBatches = await findTestBatchesWithPricesForBatch(batchId);

  return {
    batchId: batch.id,
    batchTitle: batch.title,
    isPaid: batch.isPaid,
    price: batch.price,
    originalPrice: batch.originalPrice,
    offerEndDate: batch.offerEndDate,
    priceFormatted: batch.price != null
      ? formatAmountFromPaise(batch.price)
      : null,
    originalPriceFormatted: batch.originalPrice != null
      ? formatAmountFromPaise(batch.originalPrice)
      : null,
    discountPercent:
      batch.price != null && batch.originalPrice != null
        ? Math.round(
            ((batch.originalPrice - batch.price) / batch.originalPrice) * 100
          )
        : null,
    tests: testBatches.map((tb) => ({
      testBatchId: tb.id,
      testId: tb.testId,
      price: tb.price,
      priceFormatted:
        tb.price != null ? formatAmountFromPaise(tb.price) : "Free",
      isFree: tb.price == null || tb.price === 0,
      test: tb.test,
    })),
  };
}

export async function updateBatchPricing(
  batchId: string,
  input: UpdateBatchPricingInput
) {
  const batch = await findBatchWithPricing(batchId);
  if (!batch) throw new AppError("Batch not found", 404);

  // Validate price consistency
  if (
    input.price != null &&
    input.originalPrice != null &&
    input.price > input.originalPrice
  ) {
    throw new AppError(
      "Price cannot be higher than original price",
      400
    );
  }

  return updateBatchPricingRecord(batchId, {
    price: input.price,
    originalPrice: input.originalPrice,
    offerEndDate:
      input.offerEndDate ? new Date(input.offerEndDate) : null,
  });
}

export async function updateTestPrice(
  batchId: string,
  testId: string,
  price: number | null
) {
  const testBatch = await findTestBatchWithPrice(testId, batchId);
  if (!testBatch) {
    throw new AppError(
      "This test is not linked to the specified batch",
      404
    );
  }

  return updateTestBatchPriceRecord(testId, batchId, price);
}

// ─── Price calculation ────────────────────────────────────────────────────────

/**
 * Calculates the final price for a full batch purchase.
 * Coupon application is handled separately in coupon.service.ts.
 */
export async function calculateBatchPrice(batchId: string) {
  const batch = await findBatchWithPricing(batchId);
  if (!batch) throw new AppError("Batch not found", 404);

  if (!batch.isPaid) {
    throw new AppError(
      "This batch is free — no payment required",
      400
    );
  }

  if (batch.price == null) {
    throw new AppError(
      "This batch has no price set. Please contact admin.",
      400
    );
  }

  return {
    batchId,
    amountPaise: batch.price,
    originalAmountPaise: batch.originalPrice ?? batch.price,
    amountFormatted: formatAmountFromPaise(batch.price),
    offerEndDate: batch.offerEndDate,
  };
}

/**
 * Calculates the combined price for a set of individual tests.
 * Tests with no price (free) are included at ₹0.
 */
export async function calculateIndividualTestsPrice(
  batchId: string,
  testIds: string[]
) {
  if (testIds.length === 0) {
    throw new AppError("Select at least one test", 400);
  }

  // Fetch prices for all selected tests in this batch
  const testBatches = await prisma.testBatch.findMany({
    where: {
      batchId,
      testId: { in: testIds },
    },
    select: {
      testId: true,
      price: true,
      test: {
        select: {
          id: true,
          title: true,
          totalQuestions: true,
          totalMarks: true,
        },
      },
    },
  });

  // Verify all testIds are actually in this batch
  if (testBatches.length !== testIds.length) {
    const foundIds = new Set(testBatches.map((tb) => tb.testId));
    const missing = testIds.filter((id) => !foundIds.has(id));
    throw new AppError(
      `Tests not found in this batch: ${missing.join(", ")}`,
      400
    );
  }

  const testsWithPrices = testBatches.map((tb) => ({
    testId: tb.testId,
    testTitle: tb.test.title,
    pricePaise: tb.price ?? 0,
    priceFormatted:
      tb.price != null && tb.price > 0
        ? formatAmountFromPaise(tb.price)
        : "Free",
    isFree: !tb.price || tb.price === 0,
    test: tb.test,
  }));

  const totalPaise = testsWithPrices.reduce(
    (sum, t) => sum + t.pricePaise,
    0
  );

  return {
    batchId,
    testIds,
    testsWithPrices,
    totalAmountPaise: totalPaise,
    totalAmountFormatted: formatAmountFromPaise(totalPaise),
    paidTestCount: testsWithPrices.filter((t) => !t.isFree).length,
    freeTestCount: testsWithPrices.filter((t) => t.isFree).length,
  };
}

// ─── TestPurchase management ──────────────────────────────────────────────────

export async function getStudentTestPurchasesInBatch(
  userId: string,
  batchId: string
) {
  const purchases = await findTestPurchasesByUserAndBatch(userId, batchId);
  return purchases.map((p) => p.testId);
}

export async function createTestPurchasesAfterPayment(
  userId: string,
  batchId: string,
  testIds: string[],
  paymentId: string
) {
  return createTestPurchaseRecords(
    testIds.map((testId) => ({ userId, testId, batchId, paymentId }))
  );
}

export async function getPricingRevenueStats(batchId?: string) {
  const [batchRevenue, testRevenue, testPurchaseStats] = await Promise.all([
    // Revenue from full batch purchases
    prisma.payment.aggregate({
      where: {
        status: "SUCCESS",
        purchaseType: "FULL_BATCH",
        ...(batchId ? { batchId } : {}),
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
    // Revenue from individual test purchases
    prisma.payment.aggregate({
      where: {
        status: "SUCCESS",
        purchaseType: "INDIVIDUAL_TESTS",
        ...(batchId ? { batchId } : {}),
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
    getTestPurchaseStats(batchId),
  ]);

  // Get test details for popular tests
  const topTestIds = testPurchaseStats.testCounts
    .slice(0, 5)
    .map((t) => t.testId);

  const topTests = await prisma.test.findMany({
    where: { id: { in: topTestIds } },
    select: { id: true, title: true, totalQuestions: true },
  });

  const topTestsWithCounts = testPurchaseStats.testCounts
    .slice(0, 5)
    .map((item) => ({
      testId: item.testId,
      purchaseCount: item._count.testId,
      test: topTests.find((t) => t.id === item.testId) ?? null,
    }));

  return {
    fullBatch: {
      totalRevenuePaise: batchRevenue._sum.amount ?? 0,
      totalRevenueFormatted: formatAmountFromPaise(
        batchRevenue._sum.amount ?? 0
      ),
      totalPayments: batchRevenue._count.id,
    },
    individualTests: {
      totalRevenuePaise: testRevenue._sum.amount ?? 0,
      totalRevenueFormatted: formatAmountFromPaise(
        testRevenue._sum.amount ?? 0
      ),
      totalPayments: testRevenue._count.id,
    },
    totalRevenuePaise:
      (batchRevenue._sum.amount ?? 0) + (testRevenue._sum.amount ?? 0),
    totalRevenueFormatted: formatAmountFromPaise(
      (batchRevenue._sum.amount ?? 0) + (testRevenue._sum.amount ?? 0)
    ),
    topPurchasedTests: topTestsWithCounts,
  };
}