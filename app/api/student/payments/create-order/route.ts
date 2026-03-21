import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guards";
import { ok, fail } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { createRazorpayOrder } from "@/server/services/razorpay.service";
import { prisma } from "@/server/db/prisma";
import { z } from "zod";

function getStatusCode(error: unknown) {
  if (error instanceof AppError) return error.statusCode;
  if (error instanceof Error) {
    if (error.message === "Unauthorized") return 401;
    if (error.message === "Forbidden") return 403;
  }
  return 400;
}

const createOrderSchema = z.object({
  batchId: z.string().min(1, "Batch ID is required"),
});

/**
 * Cancels any stale PENDING payments for the same user + batch.
 *
 * Prevents multiple ghost orders cluttering the DB when a student
 * opens the modal but closes it without paying, then tries again.
 * Only cancels orders older than 5 minutes (giving time for active sessions).
 */
async function cancelStalePendingPayments(
  userId: string,
  batchId: string
): Promise<number> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const result = await prisma.payment.updateMany({
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

  return result.count;
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

    // Cancel any stale pending orders before creating new one
    const cancelledCount = await cancelStalePendingPayments(
      session.userId,
      parsed.data.batchId
    );

    const result = await createRazorpayOrder({
      userId: session.userId,
      batchId: parsed.data.batchId,
    });

    return ok(
      "Payment order created successfully",
      {
        ...result,
        staleCancelledCount: cancelledCount,
      },
      201
    );
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to create order",
      getStatusCode(error)
    );
  }
}