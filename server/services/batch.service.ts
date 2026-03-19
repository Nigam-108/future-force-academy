import { AppError } from "@/server/utils/errors";
import {
  createBatchRecord,
  deleteBatchRecord,
  findBatchById,
  findBatchBySlug,
  findBatchDeleteImpact,
  findStudentBatchAssignments,
  listBatchOptions,
  listBatchRecords,
  replaceStudentBatchAssignments,
  updateBatchRecord,
  updateBatchStatusRecord,
} from "@/server/repositories/batch.repository";
import type {
  AssignStudentToBatchInput,
  CreateBatchInput,
  ListBatchesQueryInput,
  UpdateBatchInput,
  UpdateBatchStatusInput,
} from "@/server/validations/batch.schema";

/**
 * Creates a batch with slug uniqueness validation.
 */
export async function createBatch(input: CreateBatchInput, actorId?: string) {
  const existing = await findBatchBySlug(input.slug);

  if (existing) {
    throw new AppError("A batch with this slug already exists", 409);
  }

  return createBatchRecord({
    ...input,
    createdById: actorId,
  });
}

/**
 * Lists admin-visible batches.
 */
export async function listBatches(input: ListBatchesQueryInput) {
  return listBatchRecords(input);
}

/**
 * Returns one batch detail.
 */
export async function getBatchById(id: string) {
  const batch = await findBatchById(id);

  if (!batch) {
    throw new AppError("Batch not found", 404);
  }

  return batch;
}

/**
 * Updates one batch.
 */
export async function updateBatch(id: string, input: UpdateBatchInput) {
  const existing = await findBatchById(id);

  if (!existing) {
    throw new AppError("Batch not found", 404);
  }

  if (input.slug !== existing.slug) {
    const slugConflict = await findBatchBySlug(input.slug);

    if (slugConflict && slugConflict.id !== id) {
      throw new AppError("A batch with this slug already exists", 409);
    }
  }

  return updateBatchRecord(id, input);
}

/**
 * Updates only the lifecycle status of a batch.
 *
 * Lifecycle rules:
 * - DRAFT → ACTIVE: always allowed
 * - ACTIVE → CLOSED: always allowed
 * - CLOSED → ACTIVE: allowed (reopen)
 * - CLOSED → DRAFT: not allowed (would confuse enrolled students)
 * - ACTIVE → DRAFT: not allowed if students are already enrolled
 */
export async function updateBatchStatus(
  id: string,
  input: UpdateBatchStatusInput
) {
  const existing = await findBatchById(id);

  if (!existing) {
    throw new AppError("Batch not found", 404);
  }

  const currentStatus = existing.status;
  const nextStatus = input.status;

  // Guard: cannot move CLOSED or ACTIVE back to DRAFT if students enrolled
  if (nextStatus === "DRAFT") {
    if (currentStatus === "CLOSED") {
      throw new AppError(
        "Cannot move a CLOSED batch back to DRAFT. Reopen it as ACTIVE instead.",
        400
      );
    }

    if (
      currentStatus === "ACTIVE" &&
      existing._count.studentBatches > 0
    ) {
      throw new AppError(
        `Cannot move this batch back to DRAFT — ${existing._count.studentBatches} student(s) are already enrolled. Close it instead.`,
        400
      );
    }
  }

  return updateBatchStatusRecord(id, nextStatus);
}

/**
 * Deletes one batch.
 *
 * Safe delete rules:
 * - Cannot delete ACTIVE batch with enrolled students
 * - Cannot delete a batch that has tests linked to it (use Close instead)
 */
export async function deleteBatch(id: string) {
  const impact = await findBatchDeleteImpact(id);

  if (!impact) {
    throw new AppError("Batch not found", 404);
  }

  if (
    impact.status === "ACTIVE" &&
    impact._count.studentBatches > 0
  ) {
    throw new AppError(
      `Cannot delete an ACTIVE batch with ${impact._count.studentBatches} enrolled student(s). Close the batch first, then delete.`,
      409
    );
  }

  if (impact._count.testBatches > 0) {
    throw new AppError(
      `Cannot delete this batch — ${impact._count.testBatches} test(s) are linked to it. Remove the test links first via the Assign Batches page.`,
      409
    );
  }

  const deleted = await deleteBatchRecord(id);

  return {
    deletedBatchId: deleted.id,
    deletedTitle: deleted.title,
    deletedSlug: deleted.slug,
  };
}

/**
 * Lists simplified batch options for assignment screens.
 */
export async function getBatchOptions() {
  return listBatchOptions();
}

/**
 * Returns student batch assignment state.
 */
export async function getStudentBatchAssignments(studentId: string) {
  return findStudentBatchAssignments(studentId);
}

/**
 * Replaces a student's assigned batches.
 *
 * Lifecycle guard:
 * - Cannot assign student to DRAFT or CLOSED batch
 * - Only ACTIVE batches accept new student assignments
 */
export async function assignStudentToBatches(
  studentId: string,
  input: AssignStudentToBatchInput
) {
  // If batchIds is empty, we are removing all assignments — always allowed
  if (input.batchIds.length > 0) {
    // Validate each batch exists and is ACTIVE
    const batchChecks = await Promise.all(
      input.batchIds.map((batchId) => findBatchById(batchId))
    );

    const missingBatch = batchChecks.find((b) => !b);
    if (missingBatch !== undefined && !missingBatch) {
      throw new AppError("One or more selected batches were not found.", 404);
    }

    const draftBatch = batchChecks.find((b) => b?.status === "DRAFT");
    if (draftBatch) {
      throw new AppError(
        `Cannot assign student to "${draftBatch.title}" — batch is in DRAFT status. Activate it first.`,
        400
      );
    }

    const closedBatch = batchChecks.find((b) => b?.status === "CLOSED");
    if (closedBatch) {
      throw new AppError(
        `Cannot assign student to "${closedBatch.title}" — batch is CLOSED and no longer accepting new enrollments.`,
        400
      );
    }
  }

  const assigned = await replaceStudentBatchAssignments(
    studentId,
    input.batchIds
  );

  return {
    studentId,
    totalAssigned: assigned.length,
    items: assigned,
  };
}