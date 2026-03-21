import { z } from "zod";

export const createCouponSchema = z.object({
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(20, "Code must be at most 20 characters")
    .toUpperCase()
    .regex(
      /^[A-Z0-9_-]+$/,
      "Code can only contain letters, numbers, hyphens and underscores"
    ),
  description: z.string().trim().optional(),
  discountType: z.enum(["PERCENTAGE", "FLAT"]),
  discountValue: z
    .number()
    .int()
    .positive("Discount value must be positive"),
  maxUsageLimit: z.number().int().positive().optional(),
  perStudentLimit: z.number().int().min(1).default(1),
  batchId: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
});

export const updateCouponSchema = createCouponSchema
  .omit({ code: true })
  .partial();

export const toggleCouponSchema = z.object({
  isActive: z.boolean(),
});

export const listCouponsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  isActive: z.coerce.boolean().optional(),
  batchId: z.string().optional(),
});

export const validateCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
  batchId: z.string().min(1, "Batch ID is required"),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type ListCouponsQueryInput = z.infer<typeof listCouponsQuerySchema>;
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;