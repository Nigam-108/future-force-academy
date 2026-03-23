import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { AppError } from "@/server/utils/errors";
import { expireOverduePurchases } from "@/server/services/payment.service";

// ─── POST /api/admin/purchases/expire-now ─────────────────────────────────────
// Manual trigger — same logic as cron but callable from admin UI anytime
// Useful when admin wants immediate enforcement without waiting for midnight cron
export async function POST() {
  try {
    // payment.manage required — sensitive financial action
    await requireAdmin("payment.manage");

    const result = await expireOverduePurchases();

    return NextResponse.json({
      success: true,
      message: `Manually expired ${result.expired} purchase(s)`,
      data:    result,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}