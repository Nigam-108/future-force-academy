import { ContentVersionStatus, PolicyType } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

export async function findPolicyDocumentByType(type: PolicyType) {
  return prisma.policyDocument.findUnique({
    where: { type },
  });
}

export async function findLatestPublishedPolicyByType(type: PolicyType) {
  return prisma.policyVersion.findFirst({
    where: {
      status: ContentVersionStatus.PUBLISHED,
      document: {
        type,
      },
    },
    include: {
      document: true,
    },
    orderBy: [{ publishedAt: "desc" }, { versionNumber: "desc" }],
  });
}

export async function findPublishedPolicyVersionHistoryByType(type: PolicyType) {
  return prisma.policyVersion.findMany({
    where: {
      status: ContentVersionStatus.PUBLISHED,
      document: {
        type,
      },
    },
    include: {
      document: true,
    },
    orderBy: [{ versionNumber: "desc" }],
  });
}

export async function findPublishedPolicyVersionById(id: string) {
  return prisma.policyVersion.findFirst({
    where: {
      id,
      status: ContentVersionStatus.PUBLISHED,
    },
    include: {
      document: true,
    },
  });
}

export async function findPublishedPolicyVersionByTypeAndVersionNumber(
  type: PolicyType,
  versionNumber: number
) {
  return prisma.policyVersion.findFirst({
    where: {
      status: ContentVersionStatus.PUBLISHED,
      versionNumber,
      document: {
        type,
      },
    },
    include: {
      document: true,
    },
  });
}