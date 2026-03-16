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

export async function createQuestion(
  input: CreateQuestionInput,
  actorId: string
) {
  return createQuestionRecord({
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

export async function updateQuestion(id: string, input: UpdateQuestionInput) {
  const existingQuestion = await findQuestionById(id);

  if (!existingQuestion) {
    throw new AppError("Question not found", 404);
  }

  return updateQuestionRecord(id, {
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
}

export async function deleteQuestion(id: string) {
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

  return {
    deletedQuestionId: deleted.id,
    deletedQuestionText: deleted.questionText,
  };
}