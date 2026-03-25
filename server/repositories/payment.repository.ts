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
  const [
    total,
    success,
    pending,
    failed,
    totalRevenue,
    fullBatchRevenue,
    individualTestsRevenue,
  ] = await Promise.all([
    prisma.payment.count(),
    prisma.payment.count({ where: { status: PaymentStatus.SUCCESS } }),
    prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
    prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
    prisma.payment.aggregate({
      where: { status: PaymentStatus.SUCCESS },
      _sum: { amount: true },
    }),
    // Full batch purchase revenue
    prisma.payment.aggregate({
      where: {
        status: PaymentStatus.SUCCESS,
        purchaseType: "FULL_BATCH",
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
    // Individual test purchase revenue
    prisma.payment.aggregate({
      where: {
        status: PaymentStatus.SUCCESS,
        purchaseType: "INDIVIDUAL_TESTS",
      },
      _sum: { amount: true },
      _count: { id: true },
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
    fullBatch: {
      totalRevenueInPaise: fullBatchRevenue._sum.amount ?? 0,
      totalRevenueFormatted: formatAmountFromPaise(
        fullBatchRevenue._sum.amount ?? 0
      ),
      totalPayments: fullBatchRevenue._count.id,
    },
    individualTests: {
      totalRevenueInPaise: individualTestsRevenue._sum.amount ?? 0,
      totalRevenueFormatted: formatAmountFromPaise(
        individualTestsRevenue._sum.amount ?? 0
      ),
      totalPayments: individualTestsRevenue._count.id,
    },
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

/**
 * Finds a purchase by ID for admin detail view.
 */
export async function findPurchaseById(id: string) {
  return prisma.purchase.findUnique({
    where: { id },
    include: purchaseInclude,
  });
}

/**
 * Lists all purchases for one student — admin view.
 */
export async function listPurchasesByStudent(userId: string) {
  return prisma.purchase.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: purchaseInclude,
  });
}

/**
 * Lists all payments for one student — admin view.
 */
export async function listPaymentsByStudent(userId: string) {
  return prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: paymentInclude,
  });
}

// Called by cron job — only checks ACTIVE purchases, skips already EXPIRED ones
export async function findExpiredActivePurchases() {
  return prisma.purchase.findMany({
    where: {
      status: "ACTIVE",
      validUntil: {
        lt:  new Date(), // past their expiry date
        not: null,       // only if validUntil was actually set
      },
    },
    select: {
      id:         true,
      userId:     true,
      batchId:    true,
      validUntil: true,
      user: { select: { fullName: true, email: true } },
    },
  });
}

// ─── Bulk mark purchases as EXPIRED ──────────────────────────────────────────
// One query to expire many purchases at once — efficient for cron jobs
export async function bulkExpirePurchases(purchaseIds: string[]) {
  return prisma.purchase.updateMany({
    where: {
      id:     { in: purchaseIds },
      status: "ACTIVE", // safety guard — never expire already-expired ones
    },
    data: { status: "EXPIRED" },
  });
}

// ─── Check if a single purchase is currently valid ───────────────────────────
// Used in access.service.ts for real-time enforcement at access check time
// Pure function — no DB call needed, just checks the fields
export function isPurchaseValid(purchase: {
  status: string;
  validFrom?: Date | null;
  validUntil: Date | null;
}): boolean {
  return isValidityWindowActive(purchase);
}

export function isValidityWindowActive(input: {
  status: string;
  validFrom?: Date | null;
  validUntil?: Date | null;
}): boolean {
  if (input.status !== "ACTIVE") return false;

  const now = new Date();

  if (input.validFrom && now < input.validFrom) {
    return false;
  }

  if (input.validUntil && now > input.validUntil) {
    return false;
  }

  return true;
}

export function isTestPurchaseValid(testPurchase: {
  status: string;
  validFrom?: Date | null;
  validUntil?: Date | null;
}): boolean {
  return isValidityWindowActive(testPurchase);
}

export async function findExpiredActiveTestPurchases() {
  return prisma.testPurchase.findMany({
    where: {
      status: "ACTIVE",
      validUntil: {
        lt: new Date(),
        not: null,
      },
    },
    select: {
      id: true,
      userId: true,
      batchId: true,
      testId: true,
      validUntil: true,
      user: {
        select: {
          fullName: true,
          email: true,
        },
      },
      test: {
        select: {
          title: true,
        },
      },
    },
  });
}

export async function bulkExpireTestPurchases(testPurchaseIds: string[]) {
  return prisma.testPurchase.updateMany({
    where: {
      id: { in: testPurchaseIds },
      status: "ACTIVE",
    },
    data: {
      status: "EXPIRED",
    },
  });
}