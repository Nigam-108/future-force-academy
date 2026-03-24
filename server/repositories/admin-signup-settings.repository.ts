import { Prisma, ContentVersionStatus } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

export async function findSignupSettingsVersions() {
  return prisma.signupSettingsVersion.findMany({
    orderBy: [{ versionNumber: "desc" }],
  });
}

export async function findSignupSettingsVersionById(versionId: string) {
  return prisma.signupSettingsVersion.findUnique({
    where: { id: versionId },
  });
}

export async function findDraftSignupSettingsVersion() {
  return prisma.signupSettingsVersion.findFirst({
    where: {
      status: ContentVersionStatus.DRAFT,
    },
    orderBy: [{ versionNumber: "desc" }],
  });
}

export async function createSignupSettingsVersion(
  data: Prisma.SignupSettingsVersionUncheckedCreateInput
) {
  return prisma.signupSettingsVersion.create({
    data,
  });
}

export async function updateSignupSettingsVersion(
  versionId: string,
  data: Prisma.SignupSettingsVersionUncheckedUpdateInput
) {
  return prisma.signupSettingsVersion.update({
    where: { id: versionId },
    data,
  });
}
