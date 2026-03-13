import { TestMode } from "@prisma/client";
import { AppError } from "@/server/utils/errors";
import {
  createTestRecord,
  findTestBySlug,
  listStudentVisibleTestRecords,
  listTestRecords,
} from "@/server/repositories/test.repository";
import {
  CreateTestInput,
  ListTestsQueryInput,
} from "@/server/validations/test.schema";
import {
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
