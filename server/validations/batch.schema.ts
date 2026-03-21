import { z } from "zod";

/**
 * Central schema for batch CRUD and student assignment.
 *
 * Why this exists:
 * - keeps API validation consistent
 * - gives strong typing to repository/service layers
 */
export const examTypeSchema = z.enum([
  "UPSC",
  "GPSC",
  "WPSI",
  "TECHNICAL_OPERATOR",
  "OTHER",
]);

export const batchStatusSchema = z.enum(["DRAFT", "ACTIVE", "CLOSED"]);

const batchBaseSchema = z.object({
  title: z.string().trim().min(3, "Batch title must be at least 3 characters."),
  slug: z
    .string()
    .trim()
    .min(3, "Slug must be at least 3 characters.")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens."
    ),
  description: z.string().trim().optional(),
  examType: examTypeSchema,
  status: batchStatusSchema.default("DRAFT"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isPaid: z.boolean().default(false),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .default("#6366f1"),
});

function validateDateRange(
  data: z.infer<typeof batchBaseSchema>,
  ctx: z.RefinementCtx
) {
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date must be later than start date.",
      });
    }
  }
}

export const createBatchSchema = batchBaseSchema.superRefine(validateDateRange);
export const updateBatchSchema = batchBaseSchema.superRefine(validateDateRange);

export const listBatchesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  search: z.string().trim().optional(),
  examType: examTypeSchema.optional(),
  status: batchStatusSchema.optional(),
});

export const assignStudentToBatchSchema = z.object({
  batchIds: z
    .array(z.string().min(1))
    .min(1, "Select at least one batch to assign."),
});

export const updateBatchStatusSchema = z.object({
  status: batchStatusSchema,
});

export type UpdateBatchStatusInput = z.infer<typeof updateBatchStatusSchema>;

export type CreateBatchInput = z.infer<typeof createBatchSchema>;
export type UpdateBatchInput = z.infer<typeof updateBatchSchema>;
export type ListBatchesQueryInput = z.infer<typeof listBatchesQuerySchema>;
export type AssignStudentToBatchInput = z.infer<typeof assignStudentToBatchSchema>;