import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { AppError } from "@/server/utils/errors";
import { findActivityLogs } from "@/server/repositories/activity.repository";

// ─── GET /api/admin/activity-logs ─────────────────────────────────────────────
// Returns paginated activity logs with optional filters
// Query params: page, limit, userId, action, resourceType, from, to
export async function GET(req: NextRequest) {
  try {
    // Any admin can view logs — activity.view permission required
    await requireAdmin("activity.view");

    const { searchParams } = new URL(req.url);

    const page         = Number(searchParams.get("page")         ?? 1);
    const limit        = Number(searchParams.get("limit")        ?? 50);
    const userId       = searchParams.get("userId")       ?? undefined;
    const action       = searchParams.get("action")       ?? undefined;
    const resourceType = searchParams.get("resourceType") ?? undefined;
    const fromParam    = searchParams.get("from");
    const toParam      = searchParams.get("to");

    const fromDate = fromParam ? new Date(fromParam) : undefined;
    const toDate   = toParam   ? new Date(toParam)   : undefined;

    const result = await findActivityLogs({
      page,
      limit,
      userId,
      action,
      resourceType,
      fromDate,
      toDate,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}