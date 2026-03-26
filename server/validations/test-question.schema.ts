import { z } from "zod";

const marksSchema = z.coerce
  .number()
  .min(0, "Marks cannot be negative.")
  .nullable()
  .optional();

const sectionIdSchema = z.union([z.string().min(1), z.null()]).optional();

const assignTestQuestionItemSchema = z.object({
  questionId: z.string().min(1, "Question ID is required."),
  sectionId: sectionIdSchema,
  positiveMarks: marksSchema,
  negativeMarks: marksSchema,
});

export const assignTestQuestionsSchema = z
  .object({
    items: z
      .array(assignTestQuestionItemSchema)
      .min(1, "At least one question assignment is required."),
  })
  .superRefine((data, ctx) => {
    const questionIds = data.items.map((item) => item.questionId);

    const duplicateQuestionIds = questionIds.filter(
      (id, index) => questionIds.indexOf(id) !== index
    );

    if (duplicateQuestionIds.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["items"],
        message:
          "Duplicate question IDs are not allowed in the same assignment request.",
      });
    }
  });

export const updateAssignedTestQuestionSchema = z.object({
  sectionId: z.union([z.string().min(1), z.null()]).optional(),
  positiveMarks: marksSchema,
  negativeMarks: marksSchema,
});

export const deleteAssignedQuestionsSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("selected"),
    assignmentIds: z
      .array(z.string().min(1, "Assignment ID is required."))
      .min(1, "Select at least one assigned question."),
  }),
  z.object({
    mode: z.literal("all"),
  }),
]);

export type AssignTestQuestionsInput = z.infer<typeof assignTestQuestionsSchema>;
export type UpdateAssignedTestQuestionInput = z.infer<
  typeof updateAssignedTestQuestionSchema
>;
export type DeleteAssignedQuestionsInput = z.infer<
  typeof deleteAssignedQuestionsSchema
>;