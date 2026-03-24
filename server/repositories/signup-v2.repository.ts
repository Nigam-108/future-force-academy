import { ContentVersionStatus, PolicyType, Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { buildDisplayName } from "@/server/utils/name";

const pendingSignupInclude = {
  signupSettingsVersion: true,
  termsPolicyVersion: { include: { document: true } },
  privacyPolicyVersion: { include: { document: true } },
  refundPolicyVersion: { include: { document: true } },
} satisfies Prisma.PendingSignupInclude;

export type PendingSignupWithRelations = Prisma.PendingSignupGetPayload<{
  include: typeof pendingSignupInclude;
}>;

export async function findRegisteredUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, fullName: true },
  });
}

export async function findRegisteredUserByMobileNumber(mobileNumber: string) {
  return prisma.user.findFirst({
    where: { mobileNumber },
    select: { id: true, mobileNumber: true, fullName: true },
  });
}

export async function findPublishedSignupSettingsVersion() {
  return prisma.signupSettingsVersion.findFirst({
    where: { status: ContentVersionStatus.PUBLISHED },
    orderBy: [{ publishedAt: "desc" }, { versionNumber: "desc" }],
  });
}

export async function findPublishedPolicyVersions() {
  const versions = await prisma.policyVersion.findMany({
    where: { status: ContentVersionStatus.PUBLISHED },
    include: { document: true },
    orderBy: [{ publishedAt: "desc" }, { versionNumber: "desc" }],
  });

  return {
    terms: versions.find((version) => version.document.type === PolicyType.TERMS) ?? null,
    privacy: versions.find((version) => version.document.type === PolicyType.PRIVACY) ?? null,
    refund: versions.find((version) => version.document.type === PolicyType.REFUND_CANCELLATION) ?? null,
  };
}

export async function findPendingSignupByNormalizedEmail(normalizedEmail: string) {
  return prisma.pendingSignup.findUnique({
    where: { normalizedEmail },
    include: pendingSignupInclude,
  });
}

export async function findPendingSignupByNormalizedMobileNumber(normalizedMobileNumber: string) {
  return prisma.pendingSignup.findUnique({
    where: { normalizedMobileNumber },
    include: pendingSignupInclude,
  });
}

export async function createPendingSignup(data: Prisma.PendingSignupUncheckedCreateInput) {
  return prisma.pendingSignup.create({
    data,
    include: pendingSignupInclude,
  });
}

export async function updatePendingSignup(
  id: string,
  data: Prisma.PendingSignupUncheckedUpdateInput
) {
  return prisma.pendingSignup.update({
    where: { id },
    data,
    include: pendingSignupInclude,
  });
}

export async function createAuthAttempt(data: Prisma.AuthAttemptUncheckedCreateInput) {
  return prisma.authAttempt.create({ data });
}

export async function createVerifiedUserFromPendingSignup(params: {
  pendingSignup: PendingSignupWithRelations;
  ipAddress?: string;
  userAgent?: string;
  sourceContext?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        fullName: buildDisplayName(params.pendingSignup.firstName, params.pendingSignup.lastName),
        email: params.pendingSignup.normalizedEmail,
        mobileNumber: params.pendingSignup.normalizedMobileNumber,
        passwordHash: params.pendingSignup.passwordHash,
        role: "STUDENT",
        status: "ACTIVE",
        emailVerified: true,
        emailVerifiedAt: new Date(),
        marketingEmailsEnabled: params.pendingSignup.marketingEmailsEnabled,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobileNumber: true,
        role: true,
        status: true,
        emailVerified: true,
        emailVerifiedAt: true,
        marketingEmailsEnabled: true,
        createdAt: true,
      },
    });

    await tx.userPolicyConsent.createMany({
      data: [
        {
          userId: user.id,
          policyVersionId: params.pendingSignup.termsPolicyVersionId,
          policyType: PolicyType.TERMS,
          acceptedAt: params.pendingSignup.termsAcceptedAt,
          sourceContext: params.sourceContext,
          snapshot: params.pendingSignup.policyConsentSnapshot as Prisma.InputJsonValue,
        },
        {
          userId: user.id,
          policyVersionId: params.pendingSignup.privacyPolicyVersionId,
          policyType: PolicyType.PRIVACY,
          acceptedAt: params.pendingSignup.privacyAcceptedAt,
          sourceContext: params.sourceContext,
          snapshot: params.pendingSignup.policyConsentSnapshot as Prisma.InputJsonValue,
        },
        {
          userId: user.id,
          policyVersionId: params.pendingSignup.refundPolicyVersionId,
          policyType: PolicyType.REFUND_CANCELLATION,
          acceptedAt: params.pendingSignup.refundPolicyAcceptedAt,
          sourceContext: params.sourceContext,
          snapshot: params.pendingSignup.policyConsentSnapshot as Prisma.InputJsonValue,
        },
      ],
    });

    await tx.signupVerificationAudit.create({
      data: {
        pendingSignupId: params.pendingSignup.id,
        email: params.pendingSignup.normalizedEmail,
        mobileNumber: params.pendingSignup.normalizedMobileNumber,
        firstName: params.pendingSignup.firstName,
        lastName: params.pendingSignup.lastName,
        createdUserId: user.id,
        signupSettingsVersionId: params.pendingSignup.signupSettingsVersionId,
        policyConsentSnapshot: params.pendingSignup.policyConsentSnapshot as Prisma.InputJsonValue,
        verifiedAt: new Date(),
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });

    await tx.pendingSignup.delete({
      where: { id: params.pendingSignup.id },
    });

    return user;
  });
}