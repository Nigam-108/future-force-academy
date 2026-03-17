import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { fail, ok } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import {
  createBatch,
  listBatches,
} from "@/server/services/batch.service";
import {
  createBatchSchema,
  listBatchesQuerySchema,
} from "@/server/validations/batch.schema";

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

/**
 * GET: admin batch list
 * POST: create batch
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const queryObject = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = listBatchesQuerySchema.safeParse(queryObject);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const result = await listBatches(parsed.data);

    return ok("Batches fetched successfully", result, 200);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to fetch batches",
      getStatusCode(error)
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    const body = await request.json();
    const parsed = createBatchSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten());
    }

    const result = await createBatch(parsed.data, admin.userId);

    return ok("Batch created successfully", result, 201);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to create batch",
      getStatusCode(error)
    );
  }
}