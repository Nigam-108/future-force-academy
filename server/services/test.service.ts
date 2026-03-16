import { TestMode } from "@prisma/client";
import { AppError } from "@/server/utils/errors";
import {
  createTestRecord,
  findTestById,
  findTestBySlug,
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

  const slugOwner = await findTestBySlug(input.slug);

  if (slugOwner && slugOwner.id !== id) {
    throw new AppError("A test with this slug already exists", 409);
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

export async function listStudentTests(input: ListStudentTestsQueryInput) {
  const result = await listStudentVisibleTestRecords({
    page: input.page,
    limit: input.limit,
    search: input.search,
    mode: input.mode,
  });

  const mappedItems = result.items.map((test) => ({
    ...test,
    studentStatus: deriveStudentTestStatus(test),
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