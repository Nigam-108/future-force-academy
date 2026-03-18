import { AppError } from "@/server/utils/errors";
import {
  findTestBatchAssignments,
  replaceTestBatchAssignments,
} from "@/server/repositories/test-batch.repository";
import { findTestById } from "@/server/repositories/test.repository";
import type { AssignBatchesToTestInput } from "@/server/validations/test-batch.schema";

export async function getTestBatchAssignments(testId: string) {
  const test = await findTestById(testId);

  if (!test) {
    throw new AppError("Test not found", 404);
  }

  const assignments = await findTestBatchAssignments(testId);

  return {
    testId,
    testTitle: test.title,
    totalAssigned: assignments.length,
    isGlobal: assignments.length === 0,
    assignments,
  };
}

export async function assignBatchesToTest(
  testId: string,
  input: AssignBatchesToTestInput
) {
  const test = await findTestById(testId);

  if (!test) {
    throw new AppError("Test not found", 404);
  }

  const assignments = await replaceTestBatchAssignments(testId, input.batchIds);

  return {
    testId,
    testTitle: test.title,
    totalAssigned: assignments.length,
    isGlobal: assignments.length === 0,
    assignments,
  };
}