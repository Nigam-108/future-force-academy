import { PaymentGateway, PaymentStatus, Prisma, PurchaseStatus } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import type { ListPaymentsQueryInput } from "@/server/validations/payment.schema";

// ─── Shared selects ──────────────────────────────────────────────────────────

const paymentInclude = {
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
      mobileNumber: true,
    },
  },
  batch: {
    select: {
      id: true,
      title: true,
      slug: true,
      examType: true,
      isPaid: true,
    },
  },
} satisfies Prisma.PaymentInclude;

const purchaseInclude = {
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
  batch: {
    select: {
      id: true,
      title: true,
      slug: true,
      examType: true,
      isPaid: true,
      status: true,
    },
  },
  payment: {
    select: {
      id: true,
      amount: true,
      currency: true,
      status: true,
      gateway: true,
      paidAt: true,
    },
  },
} satisfies Prisma.PurchaseInclude;

// ─── Payment repository ───────────────────────────────────────────────────────

export async function listPaymentRecords(filters: ListPaymentsQueryInput) {
  const where: Prisma.PaymentWhereInput = {
    ...(filters.search
      ? {
          OR: [
            {
              user: {
                fullName: { contains: filters.search, mode: "insensitive" },
              },
            },
            {
              user: {
                email: { contains: filters.search, mode: "insensitive" },
              },
            },
            {
              batch: {
                title: { contains: filters.search, mode: "insensitive" },
              },
            },
            { orderId: { contains: filters.search, mode: "insensitive" } },
            { paymentId: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.batchId ? { batchId: filters.batchId } : {}),
    ...(filters.gateway ? { gateway: filters.gateway } : {}),
  };

  const skip = (filters.page - 1) * filters.limit;

  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: filters.limit,
      orderBy: { createdAt: "desc" },
      include: paymentInclude,
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  };
}

export async function findPaymentById(id: string) {
  return prisma.payment.findUnique({
    where: { id },
    include: {
      ...paymentInclude,
      purchases: {
        include: purchaseInclude,
      },
    },
  });
}

export async function createManualPaymentRecord(data: {
  userId: string;
  batchId: string;
  amount: number;
  notes?: string;
}) {
  return prisma.payment.create({
    data: {
      userId: data.userId,
      batchId: data.batchId,
      amount: data.amount,
      currency: "INR",
      status: PaymentStatus.SUCCESS,
      gateway: PaymentGateway.MANUAL,
      notes: data.notes,
      paidAt: new Date(),
    },
    include: paymentInclude,
  });
}

export async function updatePaymentStatusRecord(
  id: string,
  status: PaymentStatus,
  notes?: string
) {
  return prisma.payment.update({
    where: { id },
    data: {
      status,
      notes,
      ...(status === PaymentStatus.SUCCESS ? { paidAt: new Date() } : {}),
    },
    include: paymentInclude,
  });
}

export async function getPaymentSummaryStats() {
  const [total, success, pending, failed, totalRevenue] = await Promise.all([
    prisma.payment.count(),
    prisma.payment.count({ where: { status: PaymentStatus.SUCCESS } }),
    prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
    prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
    prisma.payment.aggregate({
      where: { status: PaymentStatus.SUCCESS },
      _sum: { amount: true },
    }),
  ]);

  return {
    total,
    success,
    pending,
    failed,
    totalRevenueInPaise: totalRevenue._sum.amount ?? 0,
    totalRevenueFormatted: formatAmountFromPaise(
      totalRevenue._sum.amount ?? 0
    ),
  };
}

// ─── Purchase repository ──────────────────────────────────────────────────────

export async function findPurchaseByUserAndBatch(
  userId: string,
  batchId: string
) {
  return prisma.purchase.findUnique({
    where: { userId_batchId: { userId, batchId } },
    include: purchaseInclude,
  });
}

export async function createPurchaseRecord(data: {
  userId: string;
  batchId: string;
  paymentId?: string;
  validUntil?: Date;
}) {
  return prisma.purchase.create({
    data: {
      userId: data.userId,
      batchId: data.batchId,
      paymentId: data.paymentId,
      status: PurchaseStatus.ACTIVE,
      validFrom: new Date(),
      validUntil: data.validUntil,
    },
    include: purchaseInclude,
  });
}

export async function listStudentPurchases(userId: string) {
  return prisma.purchase.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: purchaseInclude,
  });
}

export async function updatePurchaseStatusRecord(
  id: string,
  status: PurchaseStatus
) {
  return prisma.purchase.update({
    where: { id },
    data: { status },
    include: purchaseInclude,
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatAmountFromPaise(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(rupees);
}