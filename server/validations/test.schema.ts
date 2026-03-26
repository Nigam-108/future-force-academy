import {
  TestMode,
  TestStructureType,
  TestVisibilityStatus,
} from "@prisma/client";
import { z } from "zod";

const sectionSchema = z.object({
  title: z.string().min(1, "Section name is required."),
  displayOrder: z.coerce.number().int().min(1),
  durationInMinutes: z.coerce.number().int().min(1).optional(),
});

const booleanFromForm = z.preprocess((value) => {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return value;
}, z.boolean());

const testBaseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters long.")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens."
    ),
  description: z.string().optional(),
  mode: z.nativeEnum(TestMode).default(TestMode.PRACTICE),
  structureType: z
    .nativeEnum(TestStructureType)
    .default(TestStructureType.SINGLE),
  visibilityStatus: z
    .nativeEnum(TestVisibilityStatus)
    .default(TestVisibilityStatus.DRAFT),
  totalQuestions: z.coerce.number().int().min(0).default(0),
  totalMarks: z.coerce.number().min(0).default(0),
  durationInMinutes: z.coerce.number().int().min(1).optional(),
  timerMode: z.enum(["TOTAL", "SECTION_WISE"]).default("TOTAL"),
  allowSectionSwitching: booleanFromForm.default(false),
  sections: z.array(sectionSchema).default([]),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
});

type TestSchemaData = z.infer<typeof testBaseSchema>;

function validateDateRange(data: TestSchemaData, ctx: z.RefinementCtx) {
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
}

function validateStructureRules(data: TestSchemaData, ctx: z.RefinementCtx) {
  if (data.structureType === TestStructureType.SINGLE) {
    if (data.sections.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sections"],
        message: "Single tests cannot have sections.",
      });
    }

    if (data.allowSectionSwitching) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["allowSectionSwitching"],
        message: "Section switching can only be used for sectional tests.",
      });
    }

    return;
  }

  if (data.sections.length < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["sections"],
      message: "Add at least one section for a sectional test.",
    });
  }

  const emptySectionIndex = data.sections.findIndex(
    (section) => !section.title.trim()
  );

  if (emptySectionIndex >= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["sections", emptySectionIndex, "title"],
      message: "Section name is required.",
    });
  }

  if (data.timerMode === "TOTAL") {
    if (!data.durationInMinutes || data.durationInMinutes < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["durationInMinutes"],
        message:
          "Total duration is required when using whole-test timer for a sectional test.",
      });
    }
  }

  if (data.timerMode === "SECTION_WISE") {
    data.sections.forEach((section, index) => {
      if (!section.durationInMinutes || section.durationInMinutes < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sections", index, "durationInMinutes"],
          message:
            "Section duration is required when using section-wise timer.",
        });
      }
    });

    if (data.allowSectionSwitching) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["allowSectionSwitching"],
        message:
          "Section switching is not allowed when section-wise timing is enabled.",
      });
    }
  }
}

export const createTestSchema = testBaseSchema.superRefine((data, ctx) => {
  validateDateRange(data, ctx);
  validateStructureRules(data, ctx);
});

export const updateTestSchema = testBaseSchema.superRefine((data, ctx) => {
  validateDateRange(data, ctx);
  validateStructureRules(data, ctx);
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
export type UpdateTestInput = z.infer<typeof updateTestSchema>;
export type ListTestsQueryInput = z.infer<typeof listTestsQuerySchema>;