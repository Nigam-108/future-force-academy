import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { AppError } from "@/server/utils/errors";
import { getAdminAuthInsights } from "@/server/services/auth-analytics.service";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin("activity.view");

    const { searchParams } = new URL(req.url);
    const days = Number(searchParams.get("days") ?? 7);

    const result = await getAdminAuthInsights(
      Number.isFinite(days) && days > 0 ? days : 7
    );

    return NextResponse.json({
      success: true,
      message: "Auth insights fetched successfully.",
      data: result,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          data: null,
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        data: null,
      },
      { status: 500 }
    );
  }
}