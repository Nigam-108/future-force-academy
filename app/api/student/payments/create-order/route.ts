import { NextRequest } from "next/server";
import { requireAuth } from "@/server/auth/guards";
import { ok, fail } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { createRazorpayOrder } from "@/server/services/razorpay.service";
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

    const result = await createRazorpayOrder({
      userId: session.userId,
      batchId: parsed.data.batchId,
    });

    return ok("Payment order created successfully", result, 201);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to create order",
      getStatusCode(error)
    );
  }
}