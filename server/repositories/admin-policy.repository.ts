import { ContentVersionStatus, Prisma, PolicyType } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

export async function findAllPolicyDocumentsWithVersions() {
  return prisma.policyDocument.findMany({
    include: {
      versions: {
        orderBy: [{ versionNumber: "desc" }],
      },
    },
    orderBy: {
      title: "asc",
    },
  });
}

export async function findPolicyDocumentWithVersionsByType(type: PolicyType) {
  return prisma.policyDocument.findUnique({
    where: { type },
    include: {
      versions: {
        orderBy: [{ versionNumber: "desc" }],
      },
    },
  });
}

export async function findPolicyVersionById(versionId: string) {
  return prisma.policyVersion.findUnique({
    where: { id: versionId },
    include: {
      document: true,
    },
  });
}

export async function findDraftPolicyVersionByDocumentId(documentId: string) {
  return prisma.policyVersion.findFirst({
    where: {
      documentId,
      status: ContentVersionStatus.DRAFT,
    },
    orderBy: {
      versionNumber: "desc",
    },
  });
}

export async function createPolicyVersion(data: Prisma.PolicyVersionUncheckedCreateInput) {
  return prisma.policyVersion.create({
    data,
    include: {
      document: true,
    },
  });
}

export async function updatePolicyVersion(
  versionId: string,
  data: Prisma.PolicyVersionUncheckedUpdateInput
) {
  return prisma.policyVersion.update({
    where: { id: versionId },
    data,
    include: {
      document: true,
    },
  });
}