import { TestMode, TestStructureType, TestVisibilityStatus } from "@prisma/client";
import { z } from "zod";

export const createTestSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters long."),
    slug: z
      .string()
      .min(3, "Slug must be at least 3 characters long.")
      .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens."),
    description: z.string().optional(),
    mode: z.nativeEnum(TestMode).default(TestMode.PRACTICE),
    structureType: z.nativeEnum(TestStructureType).default(TestStructureType.SINGLE),
    visibilityStatus: z.nativeEnum(TestVisibilityStatus).default(TestVisibilityStatus.DRAFT),
    totalQuestions: z.coerce.number().int().min(0).default(0),
    totalMarks: z.coerce.number().min(0).default(0),
    durationInMinutes: z.coerce.number().int().min(1).optional(),
    startAt: z.string().datetime().optional(),
    endAt: z.string().datetime().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.startAt && data.endAt) {
      const start = new Date(data.startAt);
      const end = new Date(data.endAt);

      if (end <= start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endAt"],
          message: "End date/time must be later than start date/time.",
        });
      }
    }
  });

export const listTestsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  mode: z.nativeEnum(TestMode).optional(),
  structureType: z.nativeEnum(TestStructureType).optional(),
  visibilityStatus: z.nativeEnum(TestVisibilityStatus).optional(),
});

export type CreateTestInput = z.infer<typeof createTestSchema>;
export type ListTestsQueryInput = z.infer<typeof listTestsQuerySchema>;
