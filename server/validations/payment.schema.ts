import { z } from "zod";

export const listPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(["PENDING", "SUCCESS", "FAILED", "REFUNDED"]).optional(),
  batchId: z.string().optional(),
  gateway: z.enum(["RAZORPAY", "MANUAL"]).optional(),
});

export const updatePaymentStatusSchema = z.object({
  status: z.enum(["PENDING", "SUCCESS", "FAILED", "REFUNDED"]),
  notes: z.string().trim().optional(),
});

/**
 * Manual enrollment — admin grants a student access to a batch
 * without a payment (free batch, offline payment, scholarship etc.)
 */
export const manualEnrollSchema = z.object({
  userId: z.string().min(1, "Student ID is required"),
  batchId: z.string().min(1, "Batch ID is required"),
  notes: z.string().trim().optional(),
  validUntil: z.string().datetime().optional(),
});

export type ListPaymentsQueryInput = z.infer<typeof listPaymentsQuerySchema>;
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;
export type ManualEnrollInput = z.infer<typeof manualEnrollSchema>;