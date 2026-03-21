import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import type {
  CreateCouponInput,
  ListCouponsQueryInput,
  UpdateCouponInput,
} from "@/server/validations/coupon.schema";

// ─── Shared includes ──────────────────────────────────────────────────────────

const couponInclude = {
  batch: {
    select: { id: true, title: true, examType: true },
  },
  _count: {
    select: { usages: true },
  },
};

const usageInclude = {
  user: {
    select: { id: true, fullName: true, email: true },
  },
  payment: {
    select: {
      id: true,
      amount: true,
      discountAmount: true,
      originalAmount: true,
      status: true,
      createdAt: true,
    },
  },
};

// ─── Coupon CRUD ──────────────────────────────────────────────────────────────

export async function listCouponRecords(filters: ListCouponsQueryInput) {
  const where: Prisma.CouponWhereInput = {
    ...(filters.search
      ? {
          OR: [
            { code: { contains: filters.search, mode: "insensitive" } },
            {
              description: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
    ...(filters.isActive !== undefined
      ? { isActive: filters.isActive }
      : {}),
    ...(filters.batchId ? { batchId: filters.batchId } : {}),
  };

  const skip = (filters.page - 1) * filters.limit;

  const [items, total] = await Promise.all([
    prisma.coupon.findMany({
      where,
      skip,
      take: filters.limit,
      orderBy: { createdAt: "desc" },
      include: couponInclude,
    }),
    prisma.coupon.count({ where }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  };
}

export async function findCouponById(id: string) {
  return prisma.coupon.findUnique({
    where: { id },
    include: couponInclude,
  });
}

export async function findCouponByCode(code: string) {
  return prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
    include: couponInclude,
  });
}

export async function createCouponRecord(data: CreateCouponInput) {
  return prisma.coupon.create({
    data: {
      code: data.code,
      description: data.description,
      discountType: data.discountType,
      discountValue: data.discountValue,
      maxUsageLimit: data.maxUsageLimit,
      perStudentLimit: data.perStudentLimit,
      batchId: data.batchId ?? null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      isActive: data.isActive,
    },
    include: couponInclude,
  });
}

export async function updateCouponRecord(id: string, data: UpdateCouponInput) {
  return prisma.coupon.update({
    where: { id },
    data: {
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
      ...(data.discountType !== undefined
        ? { discountType: data.discountType }
        : {}),
      ...(data.discountValue !== undefined
        ? { discountValue: data.discountValue }
        : {}),
      ...(data.maxUsageLimit !== undefined
        ? { maxUsageLimit: data.maxUsageLimit }
        : {}),
      ...(data.perStudentLimit !== undefined
        ? { perStudentLimit: data.perStudentLimit }
        : {}),
      ...(data.batchId !== undefined
        ? { batchId: data.batchId ?? null }
        : {}),
      ...(data.expiresAt !== undefined
        ? { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null }
        : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
    include: couponInclude,
  });
}

export async function toggleCouponActiveRecord(id: string, isActive: boolean) {
  return prisma.coupon.update({
    where: { id },
    data: { isActive },
    include: couponInclude,
  });
}

// ─── Usage tracking ───────────────────────────────────────────────────────────

export async function countCouponUsagesByUser(couponId: string, userId: string) {
  return prisma.couponUsage.count({ where: { couponId, userId } });
}

export async function countTotalCouponUsages(couponId: string) {
  return prisma.couponUsage.count({ where: { couponId } });
}

export async function createCouponUsageRecord(data: {
  couponId: string;
  userId: string;
  paymentId: string;
  discountApplied: number;
}) {
  return prisma.couponUsage.create({
    data,
    include: usageInclude,
  });
}

export async function listCouponUsageRecords(couponId: string) {
  return prisma.couponUsage.findMany({
    where: { couponId },
    orderBy: { createdAt: "desc" },
    include: usageInclude,
  });
}

export async function getCouponStats() {
  const [total, active, totalUsages] = await Promise.all([
    prisma.coupon.count(),
    prisma.coupon.count({ where: { isActive: true } }),
    prisma.couponUsage.count(),
  ]);

  return {
    total,
    active,
    inactive: total - active,
    totalUsages,
  };
}