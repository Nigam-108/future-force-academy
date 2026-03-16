import { QuestionStatus } from "@prisma/client";
import { AppError } from "@/server/utils/errors";
import {
  createQuestionRecord,
  findQuestionById,
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
    type: input.type,
    difficulty: input.difficulty,
    status: input.status ?? QuestionStatus.DRAFT,
    questionText: input.questionText,
    optionA: input.optionA,
    optionB: input.optionB,
    optionC: input.optionC,
    optionD: input.optionD,
    correctAnswer: input.correctAnswer,
    explanation: input.explanation,
    tags: input.tags,
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
    type: input.type,
    difficulty: input.difficulty,
    status: input.status ?? existingQuestion.status,
    questionText: input.questionText,
    optionA: input.optionA,
    optionB: input.optionB,
    optionC: input.optionC,
    optionD: input.optionD,
    correctAnswer: input.correctAnswer,
    explanation: input.explanation,
    tags: input.tags,
  });
}