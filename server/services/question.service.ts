import { QuestionStatus } from "@prisma/client";
import {
  createQuestionRecord,
  listQuestionRecords,
} from "@/server/repositories/question.repository";
import {
  CreateQuestionInput,
  ListQuestionsQueryInput,
} from "@/server/validations/question.schema";

export async function createQuestion(input: CreateQuestionInput, actorId: string) {
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
