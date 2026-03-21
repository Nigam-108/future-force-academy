import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guards";
import { ok, fail } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { verifyRazorpayPayment } from "@/server/services/razorpay.service";
import { z } from "zod";

function getStatusCode(error: unknown) {
  if (error instanceof AppError) return error.statusCode;
  if (error instanceof Error) {
    if (error.message === "Unauthorized") return 401;
    if (error.message === "Forbidden") return 403;
  }
  return 400;
}

const verifySchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    if (session.role !== "STUDENT") {
      return fail("Only students can verify payments", 403);
    }

    const body = await request.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const result = await verifyRazorpayPayment({
      ...parsed.data,
      userId: session.userId,
    });

    return ok("Payment verified successfully", result, 200);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Payment verification failed",
      getStatusCode(error)
    );
  }
}