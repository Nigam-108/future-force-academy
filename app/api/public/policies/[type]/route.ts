import { NextRequest } from "next/server";
import { PolicyType } from "@prisma/client";
import { ok, fail } from "@/server/utils/api-response";
import { getPublicPolicyPageData } from "@/server/services/policy.service";
import { policyPageQuerySchema } from "@/server/validations/policy.schema";
import { AppError } from "@/server/utils/errors";

function resolvePolicyType(typeParam: string): PolicyType | null {
  switch (typeParam) {
    case "terms":
      return PolicyType.TERMS;
    case "privacy":
      return PolicyType.PRIVACY;
    case "refund-cancellation":
      return PolicyType.REFUND_CANCELLATION;
    default:
      return null;
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ type: string }> }
) {
  try {
    const { type: rawType } = await context.params;
    const type = resolvePolicyType(rawType);

    if (!type) {
      return fail("Invalid policy type", 404);
    }

    const query = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsedQuery = policyPageQuerySchema.safeParse(query);

    if (!parsedQuery.success) {
      return fail("Validation failed", 422, parsedQuery.error.flatten());
    }

    const data = await getPublicPolicyPageData({
      type,
      selectedVersionId: parsedQuery.data.versionId,
      selectedVersionNumber: parsedQuery.data.version,
    });

    return ok("Policy fetched successfully", data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch policy";
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    return fail(message, statusCode);
  }
}