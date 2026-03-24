import { PolicyType, Prisma } from "@prisma/client";
import { AppError } from "@/server/utils/errors";
import { findLatestPublishedPolicyByType } from "@/server/repositories/policy.repository";
import {
  createUserPolicyConsents,
  findUserPolicyConsentVersionIds,
} from "@/server/repositories/user-policy.repository";

const POLICY_TYPES: PolicyType[] = [
  PolicyType.TERMS,
  PolicyType.PRIVACY,
  PolicyType.REFUND_CANCELLATION,
];

const POLICY_ROUTE_MAP: Record<PolicyType, string> = {
  TERMS: "/terms",
  PRIVACY: "/privacy-policy",
  REFUND_CANCELLATION: "/refund-cancellation-policy",
};

const POLICY_LABEL_MAP: Record<PolicyType, string> = {
  TERMS: "Terms & Conditions",
  PRIVACY: "Privacy Policy",
  REFUND_CANCELLATION: "Refund / Cancellation Policy",
};

function buildUpdatedPolicyUrl(input: {
  type: PolicyType;
  versionId: string;
  summary?: string | null;
}) {
  const params = new URLSearchParams({
    versionId: input.versionId,
    updated: "1",
  });

  if (input.summary?.trim()) {
    params.set("summary", input.summary.trim());
  }

  return `${POLICY_ROUTE_MAP[input.type]}?${params.toString()}#policy-content-top`;
}

function buildPolicySnapshot(policy: {
  id: string;
  versionNumber: number;
  title: string;
  summary?: string | null;
  document: {
    type: PolicyType;
    slug: string;
    title: string;
  };
}) {
  return {
    policyVersionId: policy.id,
    versionNumber: policy.versionNumber,
    title: policy.title,
    summary: policy.summary ?? null,
    documentType: policy.document.type,
    documentSlug: policy.document.slug,
    documentTitle: policy.document.title,
    route: POLICY_ROUTE_MAP[policy.document.type],
  };
}

function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

async function getLatestPublishedPolicies() {
  const results = await Promise.all(
    POLICY_TYPES.map((type) => findLatestPublishedPolicyByType(type))
  );

  return results.filter(isDefined);
}

export async function getPendingPolicyNotices(userId: string) {
  const latestPolicies = await getLatestPublishedPolicies();

  if (!latestPolicies.length) {
    return {
      hasPendingAcknowledgements: false,
      pendingPolicies: [],
      totalPendingPolicies: 0,
    };
  }

  const existingConsentIds = await findUserPolicyConsentVersionIds(
    userId,
    latestPolicies.map((policy) => policy.id)
  );

  const pendingPolicies = latestPolicies
    .filter((policy) => !existingConsentIds.includes(policy.id))
    .map((policy) => ({
      id: policy.id,
      policyType: policy.document.type,
      label: POLICY_LABEL_MAP[policy.document.type],
      title: policy.title,
      versionNumber: policy.versionNumber,
      summary:
        policy.summary?.trim() ||
        "This policy has been updated recently. Please review the latest version.",
      publishedAt: policy.publishedAt,
      route: POLICY_ROUTE_MAP[policy.document.type],
      viewUrl: buildUpdatedPolicyUrl({
        type: policy.document.type,
        versionId: policy.id,
        summary: policy.summary,
      }),
    }));

  return {
    hasPendingAcknowledgements: pendingPolicies.length > 0,
    pendingPolicies,
    totalPendingPolicies: pendingPolicies.length,
  };
}

export async function acknowledgeAllPendingPolicies(userId: string) {
  const latestPolicies = await getLatestPublishedPolicies();

  if (!latestPolicies.length) {
    return {
      acknowledgedCount: 0,
      acknowledgedPolicyIds: [],
    };
  }

  const existingConsentIds = await findUserPolicyConsentVersionIds(
    userId,
    latestPolicies.map((policy) => policy.id)
  );

  const pendingPolicies = latestPolicies.filter(
    (policy) => !existingConsentIds.includes(policy.id)
  );

  if (!pendingPolicies.length) {
    return {
      acknowledgedCount: 0,
      acknowledgedPolicyIds: [],
    };
  }

  const now = new Date();

  const consentRows: Prisma.UserPolicyConsentCreateManyInput[] = pendingPolicies.map((policy) => ({
    userId,
    policyVersionId: policy.id,
    policyType: policy.document.type,
    acceptedAt: now,
    sourceContext: "policy_update_notice",
    snapshot: buildPolicySnapshot(policy) as Prisma.InputJsonValue,
  }));

  await createUserPolicyConsents(consentRows);

  return {
    acknowledgedCount: pendingPolicies.length,
    acknowledgedPolicyIds: pendingPolicies.map((policy) => policy.id),
  };
}

export async function assertNoPendingPolicyAcknowledgements(userId: string) {
  const pending = await getPendingPolicyNotices(userId);

  if (pending.hasPendingAcknowledgements) {
    throw new AppError("Pending policy acknowledgement required", 428);
  }

  return true;
}