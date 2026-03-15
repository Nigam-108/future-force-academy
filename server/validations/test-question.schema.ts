import { z } from "zod";

const assignTestQuestionItemSchema = z.object({
  questionId: z.string().min(1, "Question ID is required."),
  sectionId: z.string().min(1).nullable().optional(),
  displayOrder: z.coerce.number().int().min(1, "Display order must be at least 1."),
  positiveMarks: z.coerce.number().min(0).nullable().optional(),
  negativeMarks: z.coerce.number().min(0).nullable().optional(),
});

export const assignTestQuestionsSchema = z
  .object({
    items: z.array(assignTestQuestionItemSchema).min(1, "At least one question assignment is required."),
  })
  .superRefine((data, ctx) => {
    const questionIds = data.items.map((item) => item.questionId);
    const displayOrders = data.items.map((item) => item.displayOrder);

    const duplicateQuestionIds = questionIds.filter((id, index) => questionIds.indexOf(id) !== index);
    if (duplicateQuestionIds.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["items"],
        message: "Duplicate question IDs are not allowed in the same assignment request.",
      });
    }

    const duplicateDisplayOrders = displayOrders.filter(
      (value, index) => displayOrders.indexOf(value) !== index
    );
    if (duplicateDisplayOrders.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["items"],
        message: "Duplicate displayOrder values are not allowed in the same assignment request.",
      });
    }
  });

export type AssignTestQuestionsInput = z.infer<typeof assignTestQuestionsSchema>;