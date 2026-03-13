import { AppError } from "@/server/utils/errors";
import {
  createTestRecord,
  findTestBySlug,
  listTestRecords,
} from "@/server/repositories/test.repository";
import {
  CreateTestInput,
  ListTestsQueryInput,
} from "@/server/validations/test.schema";

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
