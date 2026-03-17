import { AppError } from "@/server/utils/errors";
import {
  createBatchRecord,
  deleteBatchRecord,
  findBatchById,
  findBatchBySlug,
  findStudentBatchAssignments,
  listBatchOptions,
  listBatchRecords,
  replaceStudentBatchAssignments,
  updateBatchRecord,
} from "@/server/repositories/batch.repository";
import type {
  AssignStudentToBatchInput,
  CreateBatchInput,
  ListBatchesQueryInput,
  UpdateBatchInput,
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
 * Deletes one batch.
 */
export async function deleteBatch(id: string) {
  const existing = await findBatchById(id);

  if (!existing) {
    throw new AppError("Batch not found", 404);
  }

  const deleted = await deleteBatchRecord(id);

  return {
    deletedBatchId: deleted.id,
    deletedTitle: deleted.title,
    deletedSlug: deleted.slug,
  };
}

/**
 * Lists simplified batch options for assignment screen.
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
 * Foundation behavior:
 * - set selected batches as the truth
 * - simplest admin UX for now
 */
export async function assignStudentToBatches(
  studentId: string,
  input: AssignStudentToBatchInput
) {
  const assigned = await replaceStudentBatchAssignments(studentId, input.batchIds);

  return {
    studentId,
    totalAssigned: assigned.length,
    items: assigned,
  };
}