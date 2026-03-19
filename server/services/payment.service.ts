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
  updatePaymentStatusRecord,
} from "@/server/repositories/payment.repository";
import { prisma } from "@/server/db/prisma";
import type {
  ListPaymentsQueryInput,
  ManualEnrollInput,
  UpdatePaymentStatusInput,
} from "@/server/validations/payment.schema";

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
    isActive: purchase.status === PurchaseStatus.ACTIVE,
    isExpired:
      purchase.status === PurchaseStatus.EXPIRED ||
      (purchase.validUntil !== null &&
        new Date() > new Date(purchase.validUntil)),
  }));
}