import { logActivity, ACTIONS } from "@/server/services/activity.service";
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

// ─── Create batch ─────────────────────────────────────────────────────────────
// actorId + actorFullName added for logging
export async function createBatch(
  input: CreateBatchInput,
  actorId?: string,
  actorFullName: string = "Admin"
) {
  const existing = await findBatchBySlug(input.slug);

  if (existing) {
    throw new AppError("A batch with this slug already exists", 409);
  }

  const batch = await createBatchRecord({
    ...input,
    createdById: actorId,
  });

  // Log AFTER successful creation — batch.id and input.title available here
  if (actorId) {
    await logActivity({
      userId:       actorId,
      userFullName: actorFullName,
      action:       ACTIONS.BATCH_CREATED,
      description:  `Created batch: "${batch.title}"`,
      resourceType: "batch",
      resourceId:   batch.id,
    });
  }

  return batch;
}

export async function listBatches(input: ListBatchesQueryInput) {
  return listBatchRecords(input);
}

export async function getBatchById(id: string) {
  const batch = await findBatchById(id);

  if (!batch) {
    throw new AppError("Batch not found", 404);
  }

  return batch;
}

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

// ─── Update batch status ──────────────────────────────────────────────────────
// actorId + actorFullName added for logging the status transition
export async function updateBatchStatus(
  id: string,
  input: UpdateBatchStatusInput,
  actorId: string = "",
  actorFullName: string = "Admin"
) {
  const existing = await findBatchById(id);

  if (!existing) {
    throw new AppError("Batch not found", 404);
  }

  const currentStatus = existing.status;
  const nextStatus    = input.status;

  // Guard: cannot move CLOSED or ACTIVE back to DRAFT if students enrolled
  if (nextStatus === "DRAFT") {
    if (currentStatus === "CLOSED") {
      throw new AppError(
        "Cannot move a CLOSED batch back to DRAFT. Reopen it as ACTIVE instead.",
        400
      );
    }

    if (currentStatus === "ACTIVE" && existing._count.studentBatches > 0) {
      throw new AppError(
        `Cannot move this batch back to DRAFT — ${existing._count.studentBatches} student(s) are already enrolled. Close it instead.`,
        400
      );
    }
  }

  const updated = await updateBatchStatusRecord(id, nextStatus);

  // Log AFTER successful status change — currentStatus + nextStatus available here
  if (actorId) {
    await logActivity({
      userId:       actorId,
      userFullName: actorFullName,
      action:       ACTIONS.BATCH_STATUS,
      description:  `Changed batch "${existing.title}" status from ${currentStatus} to ${nextStatus}`,
      resourceType: "batch",
      resourceId:   id,
      metadata:     { from: currentStatus, to: nextStatus },
    });
  }

  return updated;
}

export async function deleteBatch(id: string) {
  const impact = await findBatchDeleteImpact(id);

  if (!impact) {
    throw new AppError("Batch not found", 404);
  }

  if (impact.status === "ACTIVE" && impact._count.studentBatches > 0) {
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
    deletedTitle:   deleted.title,
    deletedSlug:    deleted.slug,
  };
}

export async function getBatchOptions() {
  return listBatchOptions();
}

export async function getStudentBatchAssignments(studentId: string) {
  return findStudentBatchAssignments(studentId);
}

export async function assignStudentToBatches(
  studentId: string,
  input: AssignStudentToBatchInput
) {
  if (input.batchIds.length > 0) {
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
    items:         assigned,
  };
}