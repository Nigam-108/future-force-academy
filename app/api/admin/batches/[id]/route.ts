import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { fail, ok } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import {
  deleteBatch,
  getBatchById,
  updateBatch,
} from "@/server/services/batch.service";
import { updateBatchSchema } from "@/server/validations/batch.schema";
import { prisma } from "@/server/db/prisma";

function getStatusCode(error: unknown) {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  if (error instanceof Error) {
    if (error.message === "Unauthorized") return 401;
    if (error.message === "Forbidden") return 403;
  }
  return 400;
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin("batch.manage");
    const { id } = await context.params;

    const result = await getBatchById(id);

    // Also fetch linked tests for the detail view
    const linkedTests = await prisma.testBatch.findMany({
      where: { batchId: id },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            slug: true,
            mode: true,
            visibilityStatus: true,
            totalQuestions: true,
            totalMarks: true,
          },
        },
      },
      orderBy: { assignedAt: "asc" },
    });

    return ok("Batch fetched successfully", {
      ...result,
      linkedTests: linkedTests.map((tb) => tb.test),
      linkedTestCount: linkedTests.length,
    }, 200);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to fetch batch",
      getStatusCode(error)
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin("batch.manage");

    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateBatchSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const result = await updateBatch(id, parsed.data);

    return ok("Batch updated successfully", result, 200);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to update batch",
      getStatusCode(error)
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin("batch.manage");
    const { id } = await context.params;
    const result = await deleteBatch(id);
    return ok("Batch deleted successfully", result, 200);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to delete batch",
      getStatusCode(error)
    );
  }
}