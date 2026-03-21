import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guards";
import { ok, fail } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { createRazorpayOrder } from "@/server/services/razorpay.service";
import {
  calculateBatchPrice,
  calculateIndividualTestsPrice,
} from "@/server/services/pricing.service";
import { validateCoupon } from "@/server/services/coupon.service";
import { findPurchaseByUserAndBatch } from "@/server/repositories/payment.repository";
import { prisma } from "@/server/db/prisma";
import { createOrderSchema } from "@/server/validations/pricing.schema";

function getStatusCode(error: unknown) {
  if (error instanceof AppError) return error.statusCode;
  if (error instanceof Error) {
    if (error.message === "Unauthorized") return 401;
    if (error.message === "Forbidden") return 403;
  }
  return 400;
}

/**
 * Cancels stale PENDING orders (> 5 minutes old) for the same user + batch.
 */
async function cancelStalePendingPayments(
  userId: string,
  batchId: string
): Promise<void> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  await prisma.payment.updateMany({
    where: {
      userId,
      batchId,
      status: "PENDING",
      gateway: "RAZORPAY",
      createdAt: { lt: fiveMinutesAgo },
    },
    data: {
      status: "FAILED",
      notes: "Cancelled — new order created by student",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    if (session.role !== "STUDENT") {
      return fail("Only students can create payment orders", 403);
    }

    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const { batchId, purchaseType } = parsed.data;

    // Cancel any stale pending orders
    await cancelStalePendingPayments(session.userId, batchId);

    if (purchaseType === "FULL_BATCH") {
      // ── Full batch purchase ─────────────────────────────────────────────────

      // Check not already enrolled
      const existingPurchase = await findPurchaseByUserAndBatch(
        session.userId,
        batchId
      );
      if (existingPurchase && existingPurchase.status === "ACTIVE") {
        throw new AppError(
          "You are already enrolled in this batch",
          409
        );
      }

      // Get batch price
      const batchPricing = await calculateBatchPrice(batchId);

      let finalAmountPaise = batchPricing.amountPaise;
      let discountAmountPaise = 0;
      let couponId: string | undefined;

      // Apply coupon if provided
      const couponCode = (parsed.data as { couponCode?: string })
        .couponCode;

      if (couponCode) {
        const couponResult = await validateCoupon(
          couponCode,
          batchId,
          session.userId,
          batchPricing.amountPaise
        );

        if (!couponResult.valid) {
          return fail(couponResult.reason, 400);
        }

        finalAmountPaise = couponResult.finalAmountPaise;
        discountAmountPaise = couponResult.discountAmountPaise;
        couponId = couponResult.couponId;
      }

      const result = await createRazorpayOrder({
  userId: session.userId,
  batchId,
  purchaseType: "FULL_BATCH" as const,
  couponId,
  discountAmountPaise,
  originalAmountPaise: batchPricing.amountPaise,
  finalAmountPaise,
});

      return ok(
  "Payment order created successfully",
  {
    orderId: result.orderId,
    amount: result.amount,
    currency: result.currency,
    keyId: result.keyId,
    paymentId: result.paymentId,
    batchTitle: result.batchTitle,
    studentName: result.studentName,
    studentEmail: result.studentEmail,
    purchaseType: "FULL_BATCH" as const,
    originalAmount: batchPricing.amountPaise,
    discountAmount: discountAmountPaise,
    couponApplied: !!couponId,
  },
  201
);
    } else {
      // ── Individual tests purchase ─────────────────────────────────────────

      const testIds = (parsed.data as { testIds: string[] }).testIds;

      // Check no test is already purchased individually
      const existingTestPurchases = await prisma.testPurchase.findMany({
        where: {
          userId: session.userId,
          testId: { in: testIds },
          status: "ACTIVE",
        },
        select: {
          testId: true,
          test: { select: { title: true } },
        },
      });

      // Also check if already has full batch access
      const fullBatchPurchase = await findPurchaseByUserAndBatch(
        session.userId,
        batchId
      );

      if (fullBatchPurchase && fullBatchPurchase.status === "ACTIVE") {
        throw new AppError(
          "You already have full batch access — individual test purchase not needed",
          409
        );
      }

      if (existingTestPurchases.length > 0) {
        const alreadyPurchased = existingTestPurchases
          .map((tp) => tp.test.title)
          .join(", ");
        throw new AppError(
          `You already own: ${alreadyPurchased}`,
          409
        );
      }

      // Calculate price
      const pricing = await calculateIndividualTestsPrice(batchId, testIds);

      const result = await createRazorpayOrder({
  userId: session.userId,
  batchId,
  purchaseType: "INDIVIDUAL_TESTS" as const,
  testIds,
  finalAmountPaise: pricing.totalAmountPaise,
});

      return ok(
  "Payment order created successfully",
  {
    orderId: result.orderId,
    amount: result.amount,
    currency: result.currency,
    keyId: result.keyId,
    paymentId: result.paymentId,
    batchTitle: result.batchTitle,
    studentName: result.studentName,
    studentEmail: result.studentEmail,
    purchaseType: "INDIVIDUAL_TESTS" as const,
    testsWithPrices: pricing.testsWithPrices,
    totalAmount: pricing.totalAmountPaise,
  },
  201
);
    }
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to create order",
      getStatusCode(error)
    );
  }
}