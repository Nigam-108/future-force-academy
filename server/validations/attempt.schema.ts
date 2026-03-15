import { z } from "zod";

export const startAttemptSchema = z.object({
  testId: z.string().min(1, "Test ID is required."),
});

export const saveAnswerSchema = z
  .object({
    attemptId: z.string().min(1, "Attempt ID is required."),
    testQuestionId: z.string().min(1, "Test question ID is required."),
    selectedAnswer: z.string().trim().nullable().optional(),
    markedForReview: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const hasSelectedAnswerField = Object.prototype.hasOwnProperty.call(
      data,
      "selectedAnswer"
    );
    const hasMarkedForReviewField = typeof data.markedForReview === "boolean";

    if (!hasSelectedAnswerField && !hasMarkedForReviewField) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["selectedAnswer"],
        message:
          "Provide at least one update field: selectedAnswer or markedForReview.",
      });
    }
  });

export const submitAttemptSchema = z.object({
  attemptId: z.string().min(1, "Attempt ID is required."),
});

export const getAttemptResultQuerySchema = z.object({
  attemptId: z.string().min(1, "Attempt ID is required."),
});

export const getAttemptViewQuerySchema = z.object({
  attemptId: z.string().min(1, "Attempt ID is required."),
});

export type StartAttemptInput = z.infer<typeof startAttemptSchema>;
export type SaveAnswerInput = z.infer<typeof saveAnswerSchema>;
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
export type GetAttemptResultQueryInput = z.infer<
  typeof getAttemptResultQuerySchema
>;
export type GetAttemptViewQueryInput = z.infer<
  typeof getAttemptViewQuerySchema
>;