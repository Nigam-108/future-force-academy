import { TestStructureType } from "@prisma/client";
import { AppError } from "@/server/utils/errors";
import {
  createAssignedTestQuestions,
  findQuestionsByIds,
  findSectionsByIds,
  findTestForQuestionAssignment,
  listAssignedTestQuestions,
} from "@/server/repositories/test-question.repository";
import { AssignTestQuestionsInput } from "@/server/validations/test-question.schema";

export async function getAssignedQuestionsForTest(testId: string) {
  const test = await findTestForQuestionAssignment(testId);

  if (!test) {
    throw new AppError("Test not found", 404);
  }

  const items = await listAssignedTestQuestions(testId);

  return {
    test: {
      id: test.id,
      title: test.title,
      slug: test.slug,
      structureType: test.structureType,
    },
    items,
    totalAssigned: items.length,
  };
}

export async function assignQuestionsToTest(
  testId: string,
  input: AssignTestQuestionsInput
) {
  const test = await findTestForQuestionAssignment(testId);

  if (!test) {
    throw new AppError("Test not found", 404);
  }

  const questionIds = input.items.map((item) => item.questionId);
  const sectionIds = input.items
    .map((item) => item.sectionId)
    .filter((value): value is string => Boolean(value));

  const questions = await findQuestionsByIds(questionIds);
  if (questions.length !== questionIds.length) {
    throw new AppError("One or more question IDs are invalid", 404);
  }

  const existingAssignedQuestionIds = new Set(test.testQuestions.map((item) => item.questionId));
  const duplicateExisting = questionIds.filter((id) => existingAssignedQuestionIds.has(id));
  if (duplicateExisting.length > 0) {
    throw new AppError("One or more questions are already assigned to this test", 409);
  }

  const existingDisplayOrders = new Set(test.testQuestions.map((item) => item.displayOrder));
  const duplicateDisplayOrders = input.items
    .map((item) => item.displayOrder)
    .filter((order) => existingDisplayOrders.has(order));
  if (duplicateDisplayOrders.length > 0) {
    throw new AppError("One or more displayOrder values are already used in this test", 409);
  }

  if (test.structureType === TestStructureType.SECTIONAL) {
    const anyMissingSectionId = input.items.some((item) => !item.sectionId);
    if (anyMissingSectionId) {
      throw new AppError("sectionId is required for SECTIONAL tests", 400);
    }
  }

  if (sectionIds.length > 0) {
    const sections = await findSectionsByIds(sectionIds);

    if (sections.length !== sectionIds.length) {
      throw new AppError("One or more section IDs are invalid", 404);
    }

    const invalidSectionForTest = sections.find((section) => section.testId !== test.id);
    if (invalidSectionForTest) {
      throw new AppError("One or more sections do not belong to this test", 400);
    }
  }

  const assigned = await createAssignedTestQuestions({
    testId: test.id,
    items: input.items,
  });

  return {
    test: {
      id: test.id,
      title: test.title,
      slug: test.slug,
      structureType: test.structureType,
    },
    totalAssigned: assigned.length,
    items: assigned,
  };
}