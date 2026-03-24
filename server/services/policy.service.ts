import { PolicyType } from "@prisma/client";
import { AppError } from "@/server/utils/errors";
import {
  findLatestPublishedPolicyByType,
  findPublishedPolicyVersionById,
  findPublishedPolicyVersionByTypeAndVersionNumber,
  findPublishedPolicyVersionHistoryByType,
} from "@/server/repositories/policy.repository";

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

type PolicyRecord = NonNullable<
  Awaited<ReturnType<typeof findLatestPublishedPolicyByType>>
>;

export type PublicPolicyViewModel = {
  id: string;
  versionNumber: number;
  title: string;
  summary: string | null;
  contentMarkdown: string;
  publishedAt: Date | null;
  type: PolicyType;
  slug: string;
  documentTitle: string;
  route: string;
  label: string;
};

function toPolicyViewModel(policy: PolicyRecord): PublicPolicyViewModel {
  return {
    id: policy.id,
    versionNumber: policy.versionNumber,
    title: policy.title,
    summary: policy.summary,
    contentMarkdown: policy.contentMarkdown,
    publishedAt: policy.publishedAt,
    type: policy.document.type,
    slug: policy.document.slug,
    documentTitle: policy.document.title,
    route: POLICY_ROUTE_MAP[policy.document.type],
    label: POLICY_LABEL_MAP[policy.document.type],
  };
}

export async function getPublicPolicyPageData(input: {
  type: PolicyType;
  selectedVersionId?: string;
  selectedVersionNumber?: number;
}) {
  const latest = await findLatestPublishedPolicyByType(input.type);

  if (!latest) {
    throw new AppError("No published policy version found", 404);
  }

  let selected: PolicyRecord = latest;

  if (input.selectedVersionId) {
    const byId = await findPublishedPolicyVersionById(input.selectedVersionId);

    if (byId && byId.document.type === input.type) {
      selected = byId;
    }
  } else if (
    typeof input.selectedVersionNumber === "number" &&
    Number.isFinite(input.selectedVersionNumber)
  ) {
    const byVersionNumber = await findPublishedPolicyVersionByTypeAndVersionNumber(
      input.type,
      input.selectedVersionNumber
    );

    if (byVersionNumber) {
      selected = byVersionNumber;
    }
  }

  const history = await findPublishedPolicyVersionHistoryByType(input.type);

  return {
    policy: toPolicyViewModel(selected),
    latestPolicy: toPolicyViewModel(latest),
    previousVersions: history
      .filter((item) => item.id !== latest.id)
      .map((item) => toPolicyViewModel(item)),
  };
}