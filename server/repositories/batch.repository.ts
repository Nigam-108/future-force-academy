import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import type {
  CreateBatchInput,
  UpdateBatchInput,
  ListBatchesQueryInput,
} from "@/server/validations/batch.schema";

/**
 * Shared include for admin batch list/detail views.
 */
const batchInclude = {
  createdBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
  _count: {
    select: {
      studentBatches: true,
    },
  },
} satisfies Prisma.BatchInclude;

/**
 * Creates a new batch record.
 */
export async function createBatchRecord(
  data: CreateBatchInput & { createdById?: string }
) {
  return prisma.batch.create({
    data: {
      title: data.title,
      slug: data.slug,
      description: data.description,
      examType: data.examType,
      status: data.status,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      isPaid: data.isPaid,
      createdById: data.createdById,
    },
    include: batchInclude,
  });
}

/**
 * Updates an existing batch.
 */
export async function updateBatchRecord(id: string, data: UpdateBatchInput) {
  return prisma.batch.update({
    where: { id },
    data: {
      title: data.title,
      slug: data.slug,
      description: data.description,
      examType: data.examType,
      status: data.status,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      isPaid: data.isPaid,
    },
    include: batchInclude,
  });
}

/**
 * Lists batches with admin filters and pagination.
 */
export async function listBatchRecords(filters: ListBatchesQueryInput) {
  const where: Prisma.BatchWhereInput = {
    ...(filters.search
      ? {
          OR: [
            {
              title: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
            {
              slug: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
    ...(filters.examType ? { examType: filters.examType } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  };

  const skip = (filters.page - 1) * filters.limit;

  const [items, total] = await Promise.all([
    prisma.batch.findMany({
      where,
      skip,
      take: filters.limit,
      orderBy: { createdAt: "desc" },
      include: batchInclude,
    }),
    prisma.batch.count({ where }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  };
}

/**
 * Finds a batch by ID.
 */
export async function findBatchById(id: string) {
  return prisma.batch.findUnique({
    where: { id },
    include: {
      ...batchInclude,
      studentBatches: {
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: {
          assignedAt: "desc",
        },
      },
    },
  });
}

/**
 * Finds a batch by slug for uniqueness checks.
 */
export async function findBatchBySlug(slug: string) {
  return prisma.batch.findUnique({
    where: { slug },
    include: batchInclude,
  });
}

/**
 * Deletes a batch.
 *
 * Student memberships will cascade because of the junction-table relation.
 */
export async function deleteBatchRecord(id: string) {
  return prisma.batch.delete({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
    },
  });
}

/**
 * Lists lightweight batches for student assignment UI.
 */
export async function listBatchOptions() {
  return prisma.batch.findMany({
    orderBy: [{ status: "asc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      examType: true,
      status: true,
      isPaid: true,
    },
  });
}

/**
 * Replaces one student's batch memberships.
 *
 * Current foundation rule:
 * - simplest admin flow is "set selected batches"
 * - existing memberships are replaced in one transaction
 */
export async function replaceStudentBatchAssignments(
  studentId: string,
  batchIds: string[]
) {
  return prisma.$transaction(async (tx) => {
    await tx.studentBatch.deleteMany({
      where: { studentId },
    });

    if (batchIds.length > 0) {
      await tx.studentBatch.createMany({
        data: batchIds.map((batchId) => ({
          studentId,
          batchId,
        })),
      });
    }

    return tx.studentBatch.findMany({
      where: { studentId },
      include: {
        batch: true,
      },
      orderBy: {
        assignedAt: "desc",
      },
    });
  });
}

/**
 * Reads current batch memberships for one student.
 */
export async function findStudentBatchAssignments(studentId: string) {
  return prisma.studentBatch.findMany({
    where: { studentId },
    include: {
      batch: true,
    },
    orderBy: {
      assignedAt: "desc",
    },
  });
}