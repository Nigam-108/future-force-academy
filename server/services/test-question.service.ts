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

/**
 * Ensures all provided section IDs:
 * - exist
 * - belong to this exact test
 */
async function validateSectionsForTest(testId: string, sectionIds: string[]) {
  const uniqueSectionIds = [...new Set(sectionIds.filter(Boolean))];

  if (uniqueSectionIds.length === 0) {
    return;
  }

  const sections = await findSectionsByIds(uniqueSectionIds);

  if (sections.length !== uniqueSectionIds.length) {
    throw new AppError("One or more section IDs are invalid", 404);
  }

  const invalidSectionForTest = sections.find(
    (section) => section.testId !== testId
  );

  if (invalidSectionForTest) {
    throw new AppError("One or more sections do not belong to this test", 400);
  }
}

/**
 * Returns assigned-question page data for admin.
 */
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
      totalQuestions: test.totalQuestions,
      totalMarks: test.totalMarks,
    },
    items,
    totalAssigned: items.length,
  };
}

/**
 * Assigns questions to the test using the simplified workflow.
 *
 * Important:
 * - admin does NOT provide displayOrder
 * - backend randomizes order automatically
 * - totals are refreshed after assignment
 */
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

  /**
   * Sectional tests require section mapping for each new row.
   */
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
      totalQuestions: assigned.totals.totalQuestions,
      totalMarks: assigned.totals.totalMarks,
    },
    totalAssigned: assigned.items.length,
    items: assigned.items,
  };
}

/**
 * Updates one assigned row and refreshes totals.
 *
 * Marks changes are especially important because they directly change totalMarks.
 */
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

  if (input.positiveMarks !== undefined) {
    patch.positiveMarks = input.positiveMarks;
  }

  if (input.negativeMarks !== undefined) {
    patch.negativeMarks = input.negativeMarks;
  }

  if (test.structureType === TestStructureType.SECTIONAL) {
    patch.sectionId = nextSectionId;
  } else if (
    input.sectionId !== undefined ||
    existingAssignment.sectionId !== null
  ) {
    patch.sectionId = null;
  }

  const result = await updateAssignedTestQuestionById(
    test.id,
    assignmentId,
    patch
  );

  return {
    test: {
      id: test.id,
      title: test.title,
      slug: test.slug,
      structureType: test.structureType,
      totalQuestions: result.totals.totalQuestions,
      totalMarks: result.totals.totalMarks,
    },
    item: result.item,
  };
}

/**
 * Removes one assigned row and refreshes totals.
 */
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

  const result = await deleteAssignedTestQuestionById(test.id, assignmentId);

  return {
    test: {
      id: test.id,
      title: test.title,
      slug: test.slug,
      structureType: test.structureType,
      totalQuestions: result.totals.totalQuestions,
      totalMarks: result.totals.totalMarks,
    },
    deletedAssignmentId: result.deleted.id,
    deletedQuestionId: result.deleted.questionId,
    remainingAssigned: result.totals.totalQuestions,
  };
}