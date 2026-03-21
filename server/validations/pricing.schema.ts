import { z } from "zod";

export const updateBatchPricingSchema = z.object({
  price: z
    .number()
    .int()
    .min(0, "Price cannot be negative")
    .optional()
    .nullable(),
  originalPrice: z
    .number()
    .int()
    .min(0, "Original price cannot be negative")
    .optional()
    .nullable(),
  offerEndDate: z.string().datetime().optional().nullable(),
});

export const updateTestPriceSchema = z.object({
  price: z
    .number()
    .int()
    .min(0, "Price cannot be negative")
    .optional()
    .nullable(),
});

export const createFullBatchOrderSchema = z.object({
  batchId: z.string().min(1, "Batch ID is required"),
  purchaseType: z.literal("FULL_BATCH"),
  couponCode: z.string().trim().optional(),
});

export const createIndividualTestsOrderSchema = z.object({
  batchId: z.string().min(1, "Batch ID is required"),
  purchaseType: z.literal("INDIVIDUAL_TESTS"),
  testIds: z
    .array(z.string().min(1))
    .min(1, "Select at least one test"),
});

export const createOrderSchema = z.discriminatedUnion("purchaseType", [
  createFullBatchOrderSchema,
  createIndividualTestsOrderSchema,
]);

export type UpdateBatchPricingInput = z.infer<typeof updateBatchPricingSchema>;
export type UpdateTestPriceInput = z.infer<typeof updateTestPriceSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;