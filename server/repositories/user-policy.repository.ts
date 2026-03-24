import { PolicyType, Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

export async function findUserPolicyConsentVersionIds(
  userId: string,
  policyVersionIds: string[]
) {
  if (!policyVersionIds.length) {
    return [];
  }

  const records = await prisma.userPolicyConsent.findMany({
    where: {
      userId,
      policyVersionId: {
        in: policyVersionIds,
      },
    },
    select: {
      policyVersionId: true,
    },
  });

  return records.map((record) => record.policyVersionId);
}

export async function createUserPolicyConsents(data: Prisma.UserPolicyConsentCreateManyInput[]) {
  if (!data.length) {
    return { count: 0 };
  }

  return prisma.userPolicyConsent.createMany({
    data,
    skipDuplicates: true,
  });
}

export async function findLatestAcknowledgedPolicyByType(userId: string, policyType: PolicyType) {
  return prisma.userPolicyConsent.findFirst({
    where: {
      userId,
      policyType,
    },
    include: {
      policyVersion: {
        include: {
          document: true,
        },
      },
    },
    orderBy: {
      acceptedAt: "desc",
    },
  });
}