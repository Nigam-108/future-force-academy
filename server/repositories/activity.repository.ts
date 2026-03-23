import { prisma } from "@/server/db/prisma";
import { Prisma } from "@prisma/client";

// ─── Type for creating a log entry ────────────────────────────────────────────
export type CreateActivityLogInput = {
  userId: string;
  userFullName: string;
  action: string;          // e.g. "question.created"
  description: string;     // e.g. "Created question: Newton's Laws Q1"
  resourceType?: string;   // e.g. "question"
  resourceId?: string;     // cuid of affected record
  metadata?: Record<string, unknown>; // any extra info as JSON
  ipAddress?: string;
};

// ─── Save a new activity log entry ────────────────────────────────────────────
// Fire-and-forget safe — caller doesn't need to await this
// But we still return the promise so callers CAN await if needed
export async function createActivityLog(input: CreateActivityLogInput) {
  return prisma.activityLog.create({
    data: {
      userId:       input.userId,
      userFullName: input.userFullName,
      action:       input.action,
      description:  input.description,
      resourceType: input.resourceType,
      resourceId:   input.resourceId,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
      ipAddress:    input.ipAddress,
    },
  });
}

// ─── Fetch logs with filters + pagination ─────────────────────────────────────
// Used by GET /api/admin/activity-logs
export async function findActivityLogs({
  page = 1,
  limit = 50,
  userId,
  action,
  resourceType,
  fromDate,
  toDate,
}: {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  resourceType?: string;
  fromDate?: Date;
  toDate?: Date;
}) {
  const skip = (page - 1) * limit;

  // Build dynamic where clause based on provided filters
  const where = {
    ...(userId       && { userId }),
    ...(action       && { action: { contains: action, mode: "insensitive" as const } }),
    ...(resourceType && { resourceType }),
    ...(fromDate || toDate ? {
      createdAt: {
        ...(fromDate && { gte: fromDate }),
        ...(toDate   && { lte: toDate }),
      },
    } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" }, // newest first
      skip,
      take: limit,
      select: {
        id:           true,
        action:       true,
        description:  true,
        resourceType: true,
        resourceId:   true,
        metadata:     true,
        ipAddress:    true,
        createdAt:    true,
        userFullName: true,
        userId:       true,
      },
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}