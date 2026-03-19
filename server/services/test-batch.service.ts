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

  // Validate lifecycle status of each batch being linked
  if (input.batchIds.length > 0) {
    const { prisma } = await import("@/server/db/prisma");

    const batches = await prisma.batch.findMany({
      where: { id: { in: input.batchIds } },
      select: { id: true, title: true, status: true },
    });

    if (batches.length !== input.batchIds.length) {
      throw new AppError("One or more selected batches were not found.", 404);
    }

    const draftBatch = batches.find((b) => b.status === "DRAFT");
    if (draftBatch) {
      throw new AppError(
        `Cannot link test to "${draftBatch.title}" — batch is in DRAFT status. Activate the batch first.`,
        400
      );
    }

    const closedBatch = batches.find((b) => b.status === "CLOSED");
    if (closedBatch) {
      throw new AppError(
        `Cannot link test to "${closedBatch.title}" — batch is CLOSED. Reopen it first or choose a different batch.`,
        400
      );
    }
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