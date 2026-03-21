import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { ok, fail } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { getPricingRevenueStats } from "@/server/services/pricing.service";
import { prisma } from "@/server/db/prisma";
import { formatAmountFromPaise } from "@/server/repositories/payment.repository";

function getStatusCode(error: unknown) {
  if (error instanceof AppError) return error.statusCode;
  if (error instanceof Error) {
    if (error.message === "Unauthorized") return 401;
    if (error.message === "Forbidden") return 403;
  }
  return 400;
}

/**
 * GET /api/admin/revenue
 *
 * Global revenue breakdown across all paid batches.
 * Used by the admin revenue dashboard.
 */
export async function GET(_request: NextRequest) {
  try {
    await requireAdmin();

    // ── 1. Global totals ──────────────────────────────────────────────────────
    const globalStats = await getPricingRevenueStats();

    // ── 2. Per-batch revenue ──────────────────────────────────────────────────
    const paidBatches = await prisma.batch.findMany({
      where: { isPaid: true },
      select: {
        id: true,
        title: true,
        examType: true,
        status: true,
        price: true,
        _count: {
          select: { testBatches: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const batchRevenue = await Promise.all(
      paidBatches.map(async (batch) => {
        const stats = await getPricingRevenueStats(batch.id);
        return {
          batchId: batch.id,
          batchTitle: batch.title,
          examType: batch.examType,
          status: batch.status,
          listedPricePaise: batch.price,
          listedPriceFormatted:
            batch.price != null
              ? formatAmountFromPaise(batch.price)
              : null,
          totalTests: batch._count.testBatches,
          fullBatch: {
            totalRevenueFormatted: stats.fullBatch.totalRevenueFormatted,
            totalPayments: stats.fullBatch.totalPayments,
          },
          individualTests: {
            totalRevenueFormatted:
              stats.individualTests.totalRevenueFormatted,
            totalPayments: stats.individualTests.totalPayments,
          },
          totalRevenuePaise: stats.totalRevenuePaise,
          totalRevenueFormatted: stats.totalRevenueFormatted,
          topPurchasedTests: stats.topPurchasedTests,
        };
      })
    );

    // Sort by total revenue descending
    batchRevenue.sort((a, b) => b.totalRevenuePaise - a.totalRevenuePaise);

    // ── 3. Coupon stats ───────────────────────────────────────────────────────
    const [
      totalCoupons,
      activeCoupons,
      totalCouponUsages,
      couponSavingsAgg,
    ] = await Promise.all([
      prisma.coupon.count(),
      prisma.coupon.count({ where: { isActive: true } }),
      prisma.couponUsage.count(),
      prisma.couponUsage.aggregate({
        _sum: { discountApplied: true },
      }),
    ]);

    // ── 4. Student enrollment counts ─────────────────────────────────────────
    const [totalEnrollments, activeEnrollments] = await Promise.all([
      prisma.purchase.count(),
      prisma.purchase.count({ where: { status: "ACTIVE" } }),
    ]);

    const individualTestPurchases = await prisma.testPurchase.count({
      where: { status: "ACTIVE" },
    });

    return ok(
      "Revenue stats fetched successfully",
      {
        global: globalStats,
        batchRevenue,
        coupons: {
          totalCoupons,
          activeCoupons,
          totalUsages: totalCouponUsages,
          totalSavingsPaise:
            couponSavingsAgg._sum.discountApplied ?? 0,
          totalSavingsFormatted: formatAmountFromPaise(
            couponSavingsAgg._sum.discountApplied ?? 0
          ),
        },
        enrollments: {
          totalEnrollments,
          activeEnrollments,
          individualTestPurchases,
        },
      },
      200
    );
  } catch (error) {
    return fail(
      error instanceof Error
        ? error.message
        : "Failed to fetch revenue stats",
      getStatusCode(error)
    );
  }
}