import { TestStructureType } from "@prisma/client";
import { AppError } from "@/server/utils/errors";
import {
  createAssignedTestQuestions,
  deleteAssignedTestQuestionById,
  findQuestionsByIds,
  findSectionsByIds,
  findTestForQuestionAssignment,
  listAssignedTestQuestions,
  updateAssignedTestQuestionById,
  type UpdateAssignedTestQuestionRecordInput,
} from "@/server/repositories/test-question.repository";
import type {
  AssignTestQuestionsInput,
  UpdateAssignedTestQuestionInput,
} from "@/server/validations/test-question.schema";

async function validateSectionsForTest(testId: string, sectionIds: string[]) {
  const uniqueSectionIds = [...new Set(sectionIds.filter(Boolean))];

  if (uniqueSectionIds.length === 0) {
    return;
  }

  const sections = await findSectionsByIds(uniqueSectionIds);

  if (sections.length !== uniqueSectionIds.length) {
    throw new AppError("One or more section IDs are invalid", 404);
  }

  const invalidSectionForTest = sections.find((section) => section.testId !== testId);

  if (invalidSectionForTest) {
    throw new AppError("One or more sections do not belong to this test", 400);
  }
}

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

  const existingAssignedQuestionIds = new Set(
    test.testQuestions.map((item) => item.questionId)
  );

  const duplicateExisting = questionIds.filter((id) =>
    existingAssignedQuestionIds.has(id)
  );

  if (duplicateExisting.length > 0) {
    throw new AppError(
      "One or more questions are already assigned to this test",
      409
    );
  }

  const existingDisplayOrders = new Set(
    test.testQuestions.map((item) => item.displayOrder)
  );

  const duplicateDisplayOrders = input.items
    .map((item) => item.displayOrder)
    .filter((order) => existingDisplayOrders.has(order));

  if (duplicateDisplayOrders.length > 0) {
    throw new AppError(
      "One or more displayOrder values are already used in this test",
      409
    );
  }

  if (test.structureType === TestStructureType.SECTIONAL) {
    const anyMissingSectionId = input.items.some((item) => !item.sectionId);

    if (anyMissingSectionId) {
      throw new AppError("sectionId is required for SECTIONAL tests", 400);
    }
  }

  await validateSectionsForTest(test.id, sectionIds);

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

export async function updateAssignedQuestionInTest(
  testId: string,
  assignmentId: string,
  input: UpdateAssignedTestQuestionInput
) {
  const test = await findTestForQuestionAssignment(testId);

  if (!test) {
    throw new AppError("Test not found", 404);
  }

  const existingAssignment = test.testQuestions.find(
    (item) => item.id === assignmentId
  );

  if (!existingAssignment) {
    throw new AppError("Assigned question row not found", 404);
  }

  const nextDisplayOrder = input.displayOrder ?? existingAssignment.displayOrder;

  const displayOrderConflict = test.testQuestions.find(
    (item) =>
      item.id !== assignmentId && item.displayOrder === nextDisplayOrder
  );

  if (displayOrderConflict) {
    throw new AppError(
      "This displayOrder is already used by another assigned question in the same test",
      409
    );
  }

  let nextSectionId: string | null = existingAssignment.sectionId;

  if (test.structureType === TestStructureType.SECTIONAL) {
    nextSectionId =
      input.sectionId !== undefined
        ? input.sectionId ?? null
        : existingAssignment.sectionId;

    if (!nextSectionId) {
      throw new AppError("sectionId is required for SECTIONAL tests", 400);
    }

    await validateSectionsForTest(test.id, [nextSectionId]);
  } else {
    nextSectionId = null;
  }

  const patch: UpdateAssignedTestQuestionRecordInput = {};

  if (input.displayOrder !== undefined) {
    patch.displayOrder = input.displayOrder;
  }

  if (input.positiveMarks !== undefined) {
    patch.positiveMarks = input.positiveMarks;
  }

  if (input.negativeMarks !== undefined) {
    patch.negativeMarks = input.negativeMarks;
  }

  if (test.structureType === TestStructureType.SECTIONAL) {
    patch.sectionId = nextSectionId;
  } else if (input.sectionId !== undefined || existingAssignment.sectionId !== null) {
    patch.sectionId = null;
  }

  const item = await updateAssignedTestQuestionById(assignmentId, patch);

  return {
    test: {
      id: test.id,
      title: test.title,
      slug: test.slug,
      structureType: test.structureType,
    },
    item,
  };
}

export async function removeAssignedQuestionFromTest(
  testId: string,
  assignmentId: string
) {
  const test = await findTestForQuestionAssignment(testId);

  if (!test) {
    throw new AppError("Test not found", 404);
  }

  const existingAssignment = test.testQuestions.find(
    (item) => item.id === assignmentId
  );

  if (!existingAssignment) {
    throw new AppError("Assigned question row not found", 404);
  }

  const deleted = await deleteAssignedTestQuestionById(assignmentId);

  return {
    test: {
      id: test.id,
      title: test.title,
      slug: test.slug,
      structureType: test.structureType,
    },
    deletedAssignmentId: deleted.id,
    deletedQuestionId: deleted.questionId,
    remainingAssigned: Math.max(test.testQuestions.length - 1, 0),
  };
}