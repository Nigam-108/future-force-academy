import { DifficultyLevel, QuestionStatus, QuestionType } from "@prisma/client";
import { z } from "zod";

const optionTextSchema = z
  .string()
  .trim()
  .min(1, "This option is required.")
  .max(500, "Option text is too long.");

const quickMcqSchema = z.object({
  questionText: z
    .string()
    .trim()
    .min(5, "Question text must be at least 5 characters long."),
  optionA: optionTextSchema,
  optionB: optionTextSchema,
  optionC: optionTextSchema,
  optionD: optionTextSchema,
  correctAnswer: z.enum(["A", "B", "C", "D"]),
  explanation: z.string().trim().optional(),
});

function validateQuickMcq(
  data: z.infer<typeof quickMcqSchema>,
  ctx: z.RefinementCtx
) {
  const normalizedOptions = [
    data.optionA,
    data.optionB,
    data.optionC,
    data.optionD,
  ].map((value) => value.trim().toLowerCase());

  if (new Set(normalizedOptions).size !== normalizedOptions.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["optionA"],
      message: "Options A, B, C and D must be different.",
    });
  }
}

export const createQuestionSchema = quickMcqSchema.superRefine(validateQuickMcq);
export const updateQuestionSchema = quickMcqSchema.superRefine(validateQuickMcq);

export const listQuestionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  type: z.nativeEnum(QuestionType).optional(),
  difficulty: z.nativeEnum(DifficultyLevel).optional(),
  status: z.nativeEnum(QuestionStatus).optional(),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type ListQuestionsQueryInput = z.infer<typeof listQuestionsQuerySchema>;