import { DifficultyLevel, QuestionStatus, QuestionType } from "@prisma/client";
import { z } from "zod";

const questionBaseSchema = z.object({
  type: z.nativeEnum(QuestionType).default(QuestionType.SINGLE_CORRECT),
  difficulty: z.nativeEnum(DifficultyLevel).default(DifficultyLevel.MEDIUM),
  status: z.nativeEnum(QuestionStatus).optional(),
  questionText: z
    .string()
    .trim()
    .min(5, "Question text must be at least 5 characters long."),
  optionA: z.string().trim().optional(),
  optionB: z.string().trim().optional(),
  optionC: z.string().trim().optional(),
  optionD: z.string().trim().optional(),
  correctAnswer: z.string().trim().optional(),
  explanation: z.string().trim().optional(),
  tags: z.array(z.string().trim().min(1)).default([]),
});

function validateQuestionPayload(
  data: z.infer<typeof questionBaseSchema>,
  ctx: z.RefinementCtx
) {
  if (
    data.type === QuestionType.SINGLE_CORRECT ||
    data.type === QuestionType.MULTI_CORRECT
  ) {
    if (!data.optionA || !data.optionB || !data.optionC || !data.optionD) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["optionA"],
        message: "Option A, B, C and D are required for this question type.",
      });
    }

    if (!data.correctAnswer) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["correctAnswer"],
        message: "Correct answer is required for this question type.",
      });
    }
  }

  if (data.type === QuestionType.TRUE_FALSE) {
    if (!data.correctAnswer || !["TRUE", "FALSE"].includes(data.correctAnswer)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["correctAnswer"],
        message:
          'Correct answer must be either "TRUE" or "FALSE" for TRUE_FALSE questions.',
      });
    }
  }
}

export const createQuestionSchema = questionBaseSchema.superRefine(
  validateQuestionPayload
);

export const updateQuestionSchema = questionBaseSchema.superRefine(
  validateQuestionPayload
);

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