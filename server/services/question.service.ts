import { logActivity, ACTIONS } from "@/server/services/activity.service";
import {
  DifficultyLevel,
  QuestionStatus,
  QuestionType,
} from "@prisma/client";
import { AppError } from "@/server/utils/errors";
import {
  createQuestionRecord,
  deleteQuestionRecord,
  findQuestionById,
  findQuestionDeleteImpact,
  listQuestionRecords,
  updateQuestionRecord,
} from "@/server/repositories/question.repository";
import type {
  CreateQuestionInput,
  ListQuestionsQueryInput,
  UpdateQuestionInput,
} from "@/server/validations/question.schema";

// ─── Create question ──────────────────────────────────────────────────────────
// actorId + actorFullName added so we can log who created it
export async function createQuestion(
  input: CreateQuestionInput,
  actorId: string,
  actorFullName: string = "Admin"  // default fallback
) {
  const question = await createQuestionRecord({
    createdById: actorId,
    type: QuestionType.SINGLE_CORRECT,
    difficulty: DifficultyLevel.MEDIUM,
    status: QuestionStatus.ACTIVE,
    questionText: input.questionText,
    optionA: input.optionA,
    optionB: input.optionB,
    optionC: input.optionC,
    optionD: input.optionD,
    correctAnswer: input.correctAnswer,
    explanation: input.explanation,
    tags: [],
  });

  // Log AFTER successful creation — inside the function using real variables
  await logActivity({
    userId:       actorId,
    userFullName: actorFullName,
    action:       ACTIONS.QUESTION_CREATED,
    description:  `Created question: "${input.questionText.slice(0, 60)}"`,
    resourceType: "question",
    resourceId:   question.id,
  });

  return question;
}

export async function listQuestions(input: ListQuestionsQueryInput) {
  return listQuestionRecords(input);
}

export async function getQuestionById(id: string) {
  const question = await findQuestionById(id);

  if (!question) {
    throw new AppError("Question not found", 404);
  }

  return question;
}

// ─── Update question ──────────────────────────────────────────────────────────
// actorId + actorFullName added for logging
export async function updateQuestion(
  id: string,
  input: UpdateQuestionInput,
  actorId: string = "",
  actorFullName: string = "Admin"
) {
  const existingQuestion = await findQuestionById(id);

  if (!existingQuestion) {
    throw new AppError("Question not found", 404);
  }

  const updated = await updateQuestionRecord(id, {
    type: QuestionType.SINGLE_CORRECT,
    difficulty: existingQuestion.difficulty ?? DifficultyLevel.MEDIUM,
    status: existingQuestion.status ?? QuestionStatus.ACTIVE,
    questionText: input.questionText,
    optionA: input.optionA,
    optionB: input.optionB,
    optionC: input.optionC,
    optionD: input.optionD,
    correctAnswer: input.correctAnswer,
    explanation: input.explanation,
    tags: existingQuestion.tags ?? [],
  });

  // Log AFTER successful update — using actual id variable
  if (actorId) {
    await logActivity({
      userId:       actorId,
      userFullName: actorFullName,
      action:       ACTIONS.QUESTION_UPDATED,
      description:  `Updated question: "${input.questionText.slice(0, 60)}"`,
      resourceType: "question",
      resourceId:   id,
    });
  }

  return updated;
}

// ─── Delete question ──────────────────────────────────────────────────────────
// actorId + actorFullName added for logging
export async function deleteQuestion(
  id: string,
  actorId: string = "",
  actorFullName: string = "Admin"
) {
  const existingQuestion = await findQuestionDeleteImpact(id);

  if (!existingQuestion) {
    throw new AppError("Question not found", 404);
  }

  if (existingQuestion._count.testQuestions > 0) {
    throw new AppError(
      "Cannot delete this question because it is already assigned to one or more tests. Remove it from tests first.",
      409
    );
  }

  const deleted = await deleteQuestionRecord(id);

  // Log AFTER successful deletion
  if (actorId) {
    await logActivity({
      userId:       actorId,
      userFullName: actorFullName,
      action:       ACTIONS.QUESTION_DELETED,
      description:  `Deleted question: "${deleted.questionText.slice(0, 60)}"`,
      resourceType: "question",
      resourceId:   id,
    });
  }

  return {
    deletedQuestionId: deleted.id,
    deletedQuestionText: deleted.questionText,
  };
}