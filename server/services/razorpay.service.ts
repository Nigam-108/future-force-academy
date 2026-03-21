import crypto from "crypto";
import { razorpay } from "@/server/lib/razorpay";
import { AppError } from "@/server/utils/errors";
import { prisma } from "@/server/db/prisma";
import {
  createPurchaseRecord,
  findPurchaseByUserAndBatch,
} from "@/server/repositories/payment.repository";


// ─── Types ───────────────────────────────────────────────────────────────────

type CreateOrderInput = {
  userId: string;
  batchId: string;
};

type VerifyPaymentInput = {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  userId: string;
};

// ─── Order creation ───────────────────────────────────────────────────────────

/**
 * Creates a Razorpay order for a student purchasing batch access.
 *
 * Flow:
 * 1. Validate student + batch
 * 2. Check not already enrolled
 * 3. Create a PENDING Payment record in DB
 * 4. Create Razorpay order
 * 5. Update Payment record with orderId
 * 6. Return order details to frontend
 */
export async function createRazorpayOrder(input: CreateOrderInput) {
  const { userId, batchId } = input;

  // Validate student
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, email: true, role: true },
  });

  if (!user) throw new AppError("Student not found", 404);
  if (user.role !== "STUDENT") {
    throw new AppError("Only students can purchase batch access", 400);
  }

  // Validate batch
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    select: {
      id: true,
      title: true,
      status: true,
      isPaid: true,
    },
  });

  if (!batch) throw new AppError("Batch not found", 404);

  if (batch.status !== "ACTIVE") {
    throw new AppError(
      `Batch "${batch.title}" is not currently active`,
      400
    );
  }

  if (!batch.isPaid) {
    throw new AppError(
      `Batch "${batch.title}" is free — no payment required. Contact admin for enrollment.`,
      400
    );
  }

  // Check already enrolled
  const existingPurchase = await findPurchaseByUserAndBatch(userId, batchId);

  if (existingPurchase && existingPurchase.status === "ACTIVE") {
    throw new AppError(
      `You are already enrolled in "${batch.title}"`,
      409
    );
  }

  // Amount in paise (₹1 = 100 paise)
  // TODO: Replace with actual batch price from DB when pricing model is added
  // For now using a placeholder of ₹299
  const amountInPaise = 29900;

  // Create PENDING payment record in DB first
  const payment = await prisma.payment.create({
    data: {
      userId,
      batchId,
      amount: amountInPaise,
      currency: "INR",
      status: "PENDING",
      gateway: "RAZORPAY",
    },
  });

  // Create Razorpay order
  let razorpayOrder;
  try {
    razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: payment.id,
      notes: {
        userId,
        batchId,
        paymentId: payment.id,
        batchTitle: batch.title,
        studentName: user.fullName,
        studentEmail: user.email,
      },
    });
  } catch (error) {
    // Clean up pending payment if Razorpay order creation fails
    await prisma.payment.delete({ where: { id: payment.id } });
    throw new AppError("Failed to create payment order. Please try again.", 500);
  }

  // Update payment record with Razorpay order ID
  await prisma.payment.update({
    where: { id: payment.id },
    data: { orderId: razorpayOrder.id },
  });

  return {
    orderId: razorpayOrder.id,
    amount: amountInPaise,
    currency: "INR",
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    paymentId: payment.id,
    batchTitle: batch.title,
    studentName: user.fullName,
    studentEmail: user.email,
  };
}

// ─── Payment verification ─────────────────────────────────────────────────────

/**
 * Verifies Razorpay payment signature after student completes payment.
 *
 * Flow:
 * 1. Verify HMAC signature (prevents tampered callbacks)
 * 2. Find Payment record by orderId
 * 3. Mark Payment as SUCCESS
 * 4. Create Purchase record (grants access)
 * 5. Return success
 */
export async function verifyRazorpayPayment(input: VerifyPaymentInput) {
  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    userId,
  } = input;

  // Step 1 — Verify signature
  const webhookSecret = process.env.RAZORPAY_KEY_SECRET;

  if (!webhookSecret) {
    throw new AppError("Payment verification configuration missing", 500);
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    throw new AppError("Payment verification failed — invalid signature", 400);
  }

  // Step 2 — Find payment record
  const payment = await prisma.payment.findFirst({
    where: {
      orderId: razorpayOrderId,
      userId,
    },
    select: {
      id: true,
      userId: true,
      batchId: true,
      status: true,
      amount: true,
    },
  });

  if (!payment) {
    throw new AppError("Payment record not found", 404);
  }

  // Idempotency — already processed
  if (payment.status === "SUCCESS") {
    return {
      alreadyProcessed: true,
      message: "Payment already verified",
    };
  }

  // Step 3 — Mark payment as SUCCESS
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "SUCCESS",
      paymentId: razorpayPaymentId,
      paidAt: new Date(),
    },
  });

  // Step 4 — Create or reactivate Purchase
  const existingPurchase = await findPurchaseByUserAndBatch(
    payment.userId,
    payment.batchId
  );

  if (existingPurchase) {
    await prisma.purchase.update({
      where: { id: existingPurchase.id },
      data: {
        status: "ACTIVE",
        paymentId: payment.id,
        validFrom: new Date(),
      },
    });
  } else {
    await createPurchaseRecord({
      userId: payment.userId,
      batchId: payment.batchId,
      paymentId: payment.id,
    });
  }

  return {
    alreadyProcessed: false,
    paymentId: payment.id,
    amount: payment.amount,
    message: "Payment verified and access granted successfully",
  };
}

// ─── Webhook handler ──────────────────────────────────────────────────────────

/**
 * Verifies Razorpay webhook signature.
 * Called by the webhook route before processing events.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) return false;

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  return expectedSignature === signature;
}

/**
 * Processes Razorpay webhook events.
 *
 * Handles:
 * - payment.captured → mark SUCCESS + create Purchase
 * - payment.failed   → mark FAILED
 * - refund.created   → mark REFUNDED + cancel Purchase
 */
export async function processWebhookEvent(event: {
  event: string;
  payload: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        status?: string;
        amount?: number;
        error_description?: string;
      };
    };
    refund?: {
      entity?: {
        payment_id?: string;
      };
    };
  };
}) {
  const eventType = event.event;

  // ── payment.captured ──────────────────────────────────────────────────────
  if (eventType === "payment.captured") {
    const entity = event.payload.payment?.entity;

    if (!entity?.order_id || !entity?.id) return;

    const payment = await prisma.payment.findFirst({
      where: { orderId: entity.order_id },
    });

    if (!payment || payment.status === "SUCCESS") return;

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCESS",
        paymentId: entity.id,
        paidAt: new Date(),
        gatewayResponse: entity as object,
      },
    });

    const existingPurchase = await findPurchaseByUserAndBatch(
      payment.userId,
      payment.batchId
    );

    if (existingPurchase) {
      await prisma.purchase.update({
        where: { id: existingPurchase.id },
        data: {
          status: "ACTIVE",
          paymentId: payment.id,
          validFrom: new Date(),
        },
      });
    } else {
      await createPurchaseRecord({
        userId: payment.userId,
        batchId: payment.batchId,
        paymentId: payment.id,
      });
    }

    return;
  }

  // ── payment.failed ────────────────────────────────────────────────────────
  if (eventType === "payment.failed") {
    const entity = event.payload.payment?.entity;

    if (!entity?.order_id) return;

    const payment = await prisma.payment.findFirst({
      where: { orderId: entity.order_id },
    });

    if (!payment || payment.status !== "PENDING") return;

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        notes: entity.error_description ?? "Payment failed",
        gatewayResponse: entity as object,
      },
    });

    return;
  }

  // ── refund.created ────────────────────────────────────────────────────────
  if (eventType === "refund.created") {
    const paymentEntityId = event.payload.refund?.entity?.payment_id;

    if (!paymentEntityId) return;

    const payment = await prisma.payment.findFirst({
      where: { paymentId: paymentEntityId },
    });

    if (!payment) return;

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "REFUNDED" },
    });

    const existingPurchase = await findPurchaseByUserAndBatch(
      payment.userId,
      payment.batchId
    );

    if (existingPurchase && existingPurchase.paymentId === payment.id) {
      await prisma.purchase.update({
        where: { id: existingPurchase.id },
        data: { status: "CANCELLED" },
      });
    }

    return;
  }
}

// ─── Order status fetch ───────────────────────────────────────────────────────

/**
 * Fetches the current status of a Razorpay order directly from Razorpay.
 * Used for reconciliation when our DB status may be out of sync.
 */
export async function fetchRazorpayOrderStatus(orderId: string) {
  try {
    const order = await razorpay.orders.fetch(orderId);
    return {
      orderId: order.id,
      status: order.status,        // created | attempted | paid
      amount: order.amount,
      currency: order.currency,
      attempts: order.attempts,
    };
  } catch (error) {
    throw new AppError(
      `Failed to fetch order from Razorpay: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      502
    );
  }
}

// ─── Reconciliation ───────────────────────────────────────────────────────────

/**
 * Reconciles a payment record with Razorpay's actual state.
 *
 * Use when:
 * - A payment is stuck in PENDING after 30+ minutes
 * - Webhook was missed or failed to deliver
 * - Admin wants to manually verify and fix a payment
 *
 * Flow:
 * 1. Fetch order status from Razorpay
 * 2. If Razorpay says "paid" → mark our DB as SUCCESS + create Purchase
 * 3. If Razorpay says "created" + old → mark as FAILED (stale)
 * 4. Return what changed
 */
export async function reconcilePayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      orderId: true,
      status: true,
      userId: true,
      batchId: true,
      amount: true,
      gateway: true,
      createdAt: true,
    },
  });

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  if (payment.gateway !== "RAZORPAY") {
    throw new AppError(
      "Reconciliation only supported for Razorpay payments",
      400
    );
  }

  if (!payment.orderId) {
    throw new AppError(
      "This payment has no Razorpay order ID — cannot reconcile",
      400
    );
  }

  if (payment.status === "SUCCESS" || payment.status === "REFUNDED") {
    return {
      paymentId: payment.id,
      previousStatus: payment.status,
      newStatus: payment.status,
      changed: false,
      message: `Payment is already ${payment.status} — no reconciliation needed`,
    };
  }

  // Fetch from Razorpay
  const orderStatus = await fetchRazorpayOrderStatus(payment.orderId);

  // FIX — explicitly type as full union to prevent narrowing error
  type LocalPaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  const previousStatus: LocalPaymentStatus =
    payment.status as LocalPaymentStatus;
  let newStatus: LocalPaymentStatus = previousStatus;
  let changed = false;
  let message = "";

  if (orderStatus.status === "paid") {
    // Razorpay says paid — mark SUCCESS + create Purchase
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCESS",
        paidAt: new Date(),
        notes: "Status reconciled from Razorpay — order marked as paid",
      },
    });

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
    } else if (existingPurchase.status !== "ACTIVE") {
      await prisma.purchase.update({
        where: { id: existingPurchase.id },
        data: { status: "ACTIVE", paymentId: payment.id },
      });
    }

    newStatus = "SUCCESS";
    changed = true;
    message =
      "Payment reconciled — Razorpay order is paid. Status updated to SUCCESS and batch access granted.";
  } else if (orderStatus.status === "created") {
    // Order was never attempted — check if it's stale (> 30 minutes old)
    const ageInMinutes =
      (Date.now() - new Date(payment.createdAt).getTime()) / 60000;

    if (ageInMinutes > 30) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          notes: `Reconciled — order was never attempted and is ${Math.round(
            ageInMinutes
          )} minutes old`,
        },
      });

      newStatus = "FAILED";
      changed = true;
      message = `Payment marked FAILED — order was never attempted and is ${Math.round(
        ageInMinutes
      )} minutes old.`;
    } else {
      message =
        "Order is still fresh and was never attempted. No change made — student may still pay.";
    }
  } else if (orderStatus.status === "attempted") {
    // Order was attempted but not fully paid — leave as PENDING
    message =
      "Order was attempted but not completed. Awaiting webhook or further payment attempt.";
  }

  return {
    paymentId: payment.id,
    previousStatus,
    newStatus,
    changed,
    razorpayOrderStatus: orderStatus.status,
    message,
  };
}