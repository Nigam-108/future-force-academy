import { PaymentStatus, PurchaseStatus } from "@prisma/client";
import { AppError } from "@/server/utils/errors";
import {
  createManualPaymentRecord,
  createPurchaseRecord,
  findPaymentById,
  findPurchaseByUserAndBatch,
  formatAmountFromPaise,
  getPaymentSummaryStats,
  listPaymentRecords,
  listStudentPurchases,
  listPaymentsByStudent,
  listPurchasesByStudent,
  updatePaymentStatusRecord,
  findExpiredActivePurchases,
  bulkExpirePurchases,
  findExpiredActiveTestPurchases,
  bulkExpireTestPurchases,
  isPurchaseValid,
  isTestPurchaseValid,
} from "@/server/repositories/payment.repository";

import { prisma } from "@/server/db/prisma";
import type {
  ListPaymentsQueryInput,
  ManualEnrollInput,
  UpdatePaymentStatusInput,
} from "@/server/validations/payment.schema";

import { logActivity } from "@/server/services/activity.service";



// ─── Admin payment services ───────────────────────────────────────────────────

export async function listPayments(input: ListPaymentsQueryInput) {
  const result = await listPaymentRecords(input);

  return {
    ...result,
    items: result.items.map((payment) => ({
      ...payment,
      amountFormatted: formatAmountFromPaise(payment.amount),
    })),
  };
}

export async function getPaymentById(paymentId: string) {
  const payment = await findPaymentById(paymentId);

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  return {
    ...payment,
    amountFormatted: formatAmountFromPaise(payment.amount),
  };
}

export async function getPaymentStats() {
  return getPaymentSummaryStats();
}

/**
 * Admin manually marks a payment as SUCCESS or FAILED.
 *
 * When marking SUCCESS:
 * - creates a Purchase record automatically if one doesn't exist
 *
 * When marking FAILED or REFUNDED:
 * - cancels any existing Purchase for this payment
 */
export async function updatePaymentStatus(
  paymentId: string,
  input: UpdatePaymentStatusInput
) {
  const payment = await findPaymentById(paymentId);

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  const updated = await updatePaymentStatusRecord(
    paymentId,
    input.status as PaymentStatus,
    input.notes
  );

  // Auto-create purchase on SUCCESS
  if (input.status === "SUCCESS") {
    const existingPurchase = await findPurchaseByUserAndBatch(
      payment.userId,
      payment.batchId
    );

    if (!existingPurchase) {
      await createPurchaseRecord({
        userId: payment.userId,
        batchId: payment.batchId,
        paymentId: payment.id,
      });
    } else if (existingPurchase.status !== PurchaseStatus.ACTIVE) {
      // Reactivate cancelled/expired purchase
      await prisma.purchase.update({
        where: { id: existingPurchase.id },
        data: {
          status: PurchaseStatus.ACTIVE,
          paymentId: payment.id,
        },
      });
    }
  }

  // Cancel purchase on FAILED/REFUNDED
  if (input.status === "FAILED" || input.status === "REFUNDED") {
    const existingPurchase = await findPurchaseByUserAndBatch(
      payment.userId,
      payment.batchId
    );

    if (existingPurchase && existingPurchase.paymentId === paymentId) {
      await prisma.purchase.update({
        where: { id: existingPurchase.id },
        data: { status: PurchaseStatus.CANCELLED },
      });
    }
  }

  return {
    ...updated,
    amountFormatted: formatAmountFromPaise(updated.amount),
  };
}

// ─── Manual enrollment ────────────────────────────────────────────────────────

/**
 * Admin manually enrolls a student into a batch.
 *
 * Use cases:
 * - free batch enrollment
 * - offline payment received
 * - scholarship / admin grant
 *
 * Creates both a MANUAL Payment record (₹0 for free) and a Purchase record.
 */
export async function manuallyEnrollStudent(input: ManualEnrollInput) {
  // Validate user exists and is a student
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, fullName: true, role: true },
  });

  if (!user) {
    throw new AppError("Student not found", 404);
  }

  if (user.role !== "STUDENT") {
    throw new AppError("Can only enroll student accounts", 400);
  }

  // Validate batch exists and is ACTIVE
  const batch = await prisma.batch.findUnique({
    where: { id: input.batchId },
    select: { id: true, title: true, status: true },
  });

  if (!batch) {
    throw new AppError("Batch not found", 404);
  }

  if (batch.status !== "ACTIVE") {
    throw new AppError(
      `Cannot enroll student — batch "${batch.title}" is ${batch.status}. Activate it first.`,
      400
    );
  }

  // Check if already enrolled
  const existingPurchase = await findPurchaseByUserAndBatch(
    input.userId,
    input.batchId
  );

  if (existingPurchase && existingPurchase.status === PurchaseStatus.ACTIVE) {
    throw new AppError(
      `Student is already actively enrolled in "${batch.title}"`,
      409
    );
  }

  // Create manual payment record (₹0)
  const payment = await createManualPaymentRecord({
    userId: input.userId,
    batchId: input.batchId,
    amount: 0,
    notes: input.notes || "Manual admin enrollment",
  });

  // Create or reactivate purchase
  let purchase;

  if (existingPurchase) {
    purchase = await prisma.purchase.update({
      where: { id: existingPurchase.id },
      data: {
        status: PurchaseStatus.ACTIVE,
        paymentId: payment.id,
        validFrom: new Date(),
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
      },
    });
  } else {
    purchase = await createPurchaseRecord({
      userId: input.userId,
      batchId: input.batchId,
      paymentId: payment.id,
      validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
    });
  }

  return {
    payment,
    purchase,
    message: `${user.fullName} enrolled in "${batch.title}" successfully`,
  };
}

// ─── Student purchase services ────────────────────────────────────────────────

export async function getStudentPurchases(userId: string) {
  const purchases = await listStudentPurchases(userId);

  return purchases.map((purchase) => ({
    ...purchase,
    isActive: isPurchaseValid(purchase),
    isExpired:
      purchase.status === PurchaseStatus.EXPIRED ||
      (!!purchase.validUntil && new Date() > new Date(purchase.validUntil)),
  }));
}

/**
 * Returns a single purchase record for admin detail view.
 */
export async function getAdminPurchaseById(purchaseId: string) {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          mobileNumber: true,
        },
      },
      batch: {
        select: {
          id: true,
          title: true,
          slug: true,
          examType: true,
          isPaid: true,
        },
      },
      payment: {
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          gateway: true,
          paidAt: true,
          notes: true,
        },
      },
    },
  });

  if (!purchase) {
    throw new AppError("Purchase not found", 404);
  }

  return purchase;
}

/**
 * Admin cancels a purchase manually.
 * Used for refunds, admin corrections, or access revocation.
 */
export async function cancelPurchase(purchaseId: string) {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    select: {
      id: true,
      status: true,
      userId: true,
      batchId: true,
    },
  });

  if (!purchase) {
    throw new AppError("Purchase not found", 404);
  }

  if (purchase.status === "CANCELLED") {
    throw new AppError("Purchase is already cancelled", 400);
  }

  const updated = await prisma.purchase.update({
    where: { id: purchaseId },
    data: { status: "CANCELLED" },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      batch: { select: { id: true, title: true } },
    },
  });

  return {
    purchaseId: updated.id,
    status: updated.status,
    user: updated.user,
    batch: updated.batch,
    message: `Purchase cancelled for ${updated.user.fullName} in "${updated.batch.title}"`,
  };
}

/**
 * Returns full payment + purchase history for one student.
 * Used on the admin student detail page.
 */
export async function getStudentPurchaseHistory(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, email: true },
  });

  if (!user) {
    throw new AppError("Student not found", 404);
  }

  const [payments, purchases] = await Promise.all([
    listPaymentsByStudent(userId),
    listPurchasesByStudent(userId),
  ]);

  return {
    user,
    payments: payments.map((p) => ({
      ...p,
      amountFormatted: formatAmountFromPaise(p.amount),
    })),
    purchases,
    totalPayments: payments.length,
    totalPurchases: purchases.length,
    activePurchases: purchases.filter((p) => p.status === "ACTIVE").length,
  };
}

// ─── Expire all overdue purchases ─────────────────────────────────────────────
// Called by cron job daily OR manually from admin panel
// Finds all ACTIVE purchases past validUntil → marks them EXPIRED in bulk
// Logs the action to activity trail with count + affected IDs
export async function expireOverduePurchases(): Promise<{
  checked: number;
  expired: number;
  purchaseDetails: Array<{ id: string; userId: string; batchId: string | null }>;
  testPurchaseDetails: Array<{
    id: string;
    userId: string;
    batchId: string | null;
    testId: string;
  }>;
}> {
  const [expiredPurchases, expiredTestPurchases] = await Promise.all([
    findExpiredActivePurchases(),
    findExpiredActiveTestPurchases(),
  ]);

  const purchaseIds = expiredPurchases.map((p) => p.id);
  const testPurchaseIds = expiredTestPurchases.map((tp) => tp.id);

  const [purchaseResult, testPurchaseResult] = await Promise.all([
    purchaseIds.length > 0
      ? bulkExpirePurchases(purchaseIds)
      : Promise.resolve({ count: 0 }),
    testPurchaseIds.length > 0
      ? bulkExpireTestPurchases(testPurchaseIds)
      : Promise.resolve({ count: 0 }),
  ]);

  const totalExpired = purchaseResult.count + testPurchaseResult.count;
  const totalChecked = expiredPurchases.length + expiredTestPurchases.length;

  if (totalExpired > 0) {
    await logActivity({
      userId: "system",
      userFullName: "System (Cron)",
      action: "purchase.expired",
      description: `Auto-expired ${totalExpired} overdue access record(s)`,
      resourceType: "purchase",
      metadata: {
        expiredPurchaseCount: purchaseResult.count,
        expiredTestPurchaseCount: testPurchaseResult.count,
        purchaseIds,
        testPurchaseIds,
      },
    });
  }

  return {
    checked: totalChecked,
    expired: totalExpired,
    purchaseDetails: expiredPurchases.map((p) => ({
      id: p.id,
      userId: p.userId,
      batchId: p.batchId,
    })),
    testPurchaseDetails: expiredTestPurchases.map((tp) => ({
      id: tp.id,
      userId: tp.userId,
      batchId: tp.batchId,
      testId: tp.testId,
    })),
  };
}
