import { TestMode, TestVisibilityStatus } from "@prisma/client";
import { AppError } from "@/server/utils/errors";
import {
  createTestRecord,
  deleteTestRecord,
  duplicateTestRecord,
  findTestBlueprintForDuplication,
  findTestById,
  findTestBySlug,
  findTestDeleteImpact,
  listStudentVisibleTestRecords,
  listTestRecords,
  updateTestRecord,
} from "@/server/repositories/test.repository";
import type {
  CreateTestInput,
  ListTestsQueryInput,
  UpdateTestInput,
} from "@/server/validations/test.schema";
import type {
  ListStudentTestsQueryInput,
  StudentTestStatus,
} from "@/server/validations/student-test.schema";

/**
 * Converts any title into a slug-safe format.
 */
function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Builds a unique slug by appending -copy, -copy-2, etc.
 */
async function buildUniqueDuplicateSlug(baseTitle: string) {
  const baseSlug = slugify(baseTitle);
  let candidate = `${baseSlug}-copy`;
  let counter = 2;

  while (await findTestBySlug(candidate)) {
    candidate = `${baseSlug}-copy-${counter}`;
    counter += 1;
  }

  return candidate;
}

export async function createTest(input: CreateTestInput, actorId: string) {
  const existingTest = await findTestBySlug(input.slug);

  if (existingTest) {
    throw new AppError("A test with this slug already exists", 409);
  }

  return createTestRecord({
    createdById: actorId,
    title: input.title,
    slug: input.slug,
    description: input.description,
    mode: input.mode,
    structureType: input.structureType,
    visibilityStatus: input.visibilityStatus,
    totalQuestions: input.totalQuestions,
    totalMarks: input.totalMarks,
    durationInMinutes: input.durationInMinutes,
    startAt: input.startAt ? new Date(input.startAt) : undefined,
    endAt: input.endAt ? new Date(input.endAt) : undefined,
  });
}

export async function listTests(input: ListTestsQueryInput) {
  return listTestRecords(input);
}

export async function getTestById(id: string) {
  const test = await findTestById(id);

  if (!test) {
    throw new AppError("Test not found", 404);
  }

  return test;
}

export async function updateTest(id: string, input: UpdateTestInput) {
  const existingTest = await findTestById(id);

  if (!existingTest) {
    throw new AppError("Test not found", 404);
  }

  if (input.slug !== existingTest.slug) {
    const slugConflict = await findTestBySlug(input.slug);

    if (slugConflict && slugConflict.id !== id) {
      throw new AppError("A test with this slug already exists", 409);
    }
  }

  return updateTestRecord(id, {
    title: input.title,
    slug: input.slug,
    description: input.description,
    mode: input.mode,
    structureType: input.structureType,
    visibilityStatus: input.visibilityStatus,
    totalQuestions: input.totalQuestions,
    totalMarks: input.totalMarks,
    durationInMinutes: input.durationInMinutes,
    startAt: input.startAt ? new Date(input.startAt) : undefined,
    endAt: input.endAt ? new Date(input.endAt) : undefined,
  });
}

/**
 * Duplicates an existing test into a new DRAFT test.
 *
 * What gets copied:
 * - core test settings
 * - sections
 * - assigned questions
 * - totals
 *
 * What does NOT get copied:
 * - attempts
 * - results
 * - rankings
 */
export async function duplicateTest(id: string, actorId: string) {
  const sourceTest = await findTestBlueprintForDuplication(id);

  if (!sourceTest) {
    throw new AppError("Test not found", 404);
  }

  const newTitle = `${sourceTest.title} Copy`;
  const newSlug = await buildUniqueDuplicateSlug(sourceTest.title);

  const duplicated = await duplicateTestRecord({
    sourceTest,
    newTitle,
    newSlug,
    createdById: actorId,
  });

  if (!duplicated) {
    throw new AppError("Failed to duplicate test", 500);
  }

  return duplicated;
}

function deriveStudentTestStatus(test: {
  mode: TestMode;
  startAt: Date | null;
  endAt: Date | null;
}): StudentTestStatus {
  const now = new Date();

  if (test.mode === TestMode.PRACTICE) {
    return "AVAILABLE";
  }

  if (test.mode === TestMode.LIVE) {
    if (test.startAt && now < test.startAt) {
      return "UPCOMING";
    }

    if (test.endAt && now > test.endAt) {
      return "COMPLETED";
    }

    return "LIVE";
  }

  if (test.mode === TestMode.ASSIGNED) {
    if (test.startAt && now < test.startAt) {
      return "UPCOMING";
    }

    if (test.endAt && now > test.endAt) {
      return "COMPLETED";
    }

    return "AVAILABLE";
  }

  return "AVAILABLE";
}

export async function listStudentTests(
  input: ListStudentTestsQueryInput,
  userId: string
) {
  const result = await listStudentVisibleTestRecords({
    page: input.page,
    limit: input.limit,
    search: input.search,
    mode: input.mode,
    userId,
  });
  const mappedItems = result.items.map((test) => ({
    ...test,
    studentStatus: deriveStudentTestStatus(test),
    isGlobal: (test._count as { testQuestions: number; testBatches: number }).testBatches === 0,
  }));

  const filteredItems = input.studentStatus
    ? mappedItems.filter((item) => item.studentStatus === input.studentStatus)
    : mappedItems;

  return {
    ...result,
    items: filteredItems,
    filteredCount: filteredItems.length,
  };
}

export async function deleteTest(id: string) {
  const existingTest = await findTestDeleteImpact(id);

  if (!existingTest) {
    throw new AppError("Test not found", 404);
  }

  if (existingTest._count.attempts > 0) {
    throw new AppError(
      "Cannot delete this test because student attempts already exist. Close it instead.",
      409
    );
  }

  const deleted = await deleteTestRecord(id);

  return {
    deletedTestId: deleted.id,
    deletedTitle: deleted.title,
    deletedSlug: deleted.slug,
    removedSections: existingTest._count.sections,
    removedAssignedQuestions: existingTest._count.testQuestions,
  };
}