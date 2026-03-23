import { NextRequest, NextResponse } from "next/server";
import { expireOverduePurchases } from "@/server/services/payment.service";

// ─── GET /api/cron/expire-purchases ───────────────────────────────────────────
// Triggered by Vercel Cron daily at midnight UTC (see vercel.json)
// Also callable manually with correct CRON_SECRET header
//
// Manual test:
// curl -H "Authorization: Bearer YOUR_SECRET" http://localhost:3000/api/cron/expire-purchases
export async function GET(req: NextRequest) {
  try {
    // ── Protect endpoint with CRON_SECRET ────────────────────────────────────
    // Set CRON_SECRET in .env.local and Vercel env variables
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      // Secret is configured — enforce it strictly
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { message: "Unauthorized — invalid cron secret" },
          { status: 401 }
        );
      }
    } else {
      // No secret configured — warn but allow (useful for local dev)
      console.warn("[Cron] WARNING: CRON_SECRET not set — endpoint is unprotected!");
    }

    console.log("[Cron] Starting purchase expiry check...");

    const result = await expireOverduePurchases();

    console.log(`[Cron] Done — expired ${result.expired} of ${result.checked} purchases`);

    return NextResponse.json({
      success: true,
      message: `Expired ${result.expired} purchase(s)`,
      data:    result,
    });
  } catch (error) {
    console.error("[Cron] expire-purchases failed:", error);
    return NextResponse.json(
      { success: false, message: "Cron job failed" },
      { status: 500 }
    );
  }
}