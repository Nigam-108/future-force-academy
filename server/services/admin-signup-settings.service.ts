import { ContentVersionStatus, Prisma } from "@prisma/client";
import { AppError } from "@/server/utils/errors";
import {
  createSignupSettingsVersion,
  findDraftSignupSettingsVersion,
  findSignupSettingsVersionById,
  findSignupSettingsVersions,
  updateSignupSettingsVersion,
} from "@/server/repositories/admin-signup-settings.repository";

type AdminSessionLike = {
  userId: string;
  role: "ADMIN" | "SUB_ADMIN" | "STUDENT";
};

type SignupSettingsConfig = {
  otpLength: 4;
  otpExpiryMinutes: number;
  resendCooldownSeconds: number;
  resendLimit: number;
  resendWindowMinutes: number;
  resendBlockMinutes: number;
  wrongAttemptLimit: number;
  wrongAttemptBlockMinutes: number;
  pendingLifetimeHours: number;
  allowEmailOtpOnly: true;
  requireMobileNumber: true;
  loginIdentifierMode: "EMAIL_OR_MOBILE";
  marketingEmailsOptInDefault: boolean;
  turnstileSuspiciousAttemptThreshold: number;
  signupReviewMessage: string;
  oneAccountWarningText: string;
};

const DEFAULT_SIGNUP_SETTINGS: SignupSettingsConfig = {
  otpLength: 4,
  otpExpiryMinutes: 10,
  resendCooldownSeconds: 60,
  resendLimit: 5,
  resendWindowMinutes: 15,
  resendBlockMinutes: 30,
  wrongAttemptLimit: 5,
  wrongAttemptBlockMinutes: 5,
  pendingLifetimeHours: 24,
  allowEmailOtpOnly: true,
  requireMobileNumber: true,
  loginIdentifierMode: "EMAIL_OR_MOBILE",
  marketingEmailsOptInDefault: true,
  turnstileSuspiciousAttemptThreshold: 3,
  signupReviewMessage:
    "Please review your details carefully before sending OTP.",
  oneAccountWarningText:
    "Only one account is allowed per email and mobile number.",
};

function assertAdmin(session: AdminSessionLike) {
  if (session.role !== "ADMIN") {
    throw new AppError("Only admin can manage signup settings", 403);
  }
}

function readPositiveInt(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : fallback;
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function resolveSignupSettings(raw: unknown): SignupSettingsConfig {
  if (!raw || typeof raw !== "object") {
    return DEFAULT_SIGNUP_SETTINGS;
  }

  const settings = raw as Record<string, unknown>;

  return {
    otpLength: 4,
    otpExpiryMinutes: readPositiveInt(settings.otpExpiryMinutes, DEFAULT_SIGNUP_SETTINGS.otpExpiryMinutes),
    resendCooldownSeconds: readPositiveInt(
      settings.resendCooldownSeconds,
      DEFAULT_SIGNUP_SETTINGS.resendCooldownSeconds
    ),
    resendLimit: readPositiveInt(settings.resendLimit, DEFAULT_SIGNUP_SETTINGS.resendLimit),
    resendWindowMinutes: readPositiveInt(
      settings.resendWindowMinutes,
      DEFAULT_SIGNUP_SETTINGS.resendWindowMinutes
    ),
    resendBlockMinutes: readPositiveInt(
      settings.resendBlockMinutes,
      DEFAULT_SIGNUP_SETTINGS.resendBlockMinutes
    ),
    wrongAttemptLimit: readPositiveInt(
      settings.wrongAttemptLimit,
      DEFAULT_SIGNUP_SETTINGS.wrongAttemptLimit
    ),
    wrongAttemptBlockMinutes: readPositiveInt(
      settings.wrongAttemptBlockMinutes,
      DEFAULT_SIGNUP_SETTINGS.wrongAttemptBlockMinutes
    ),
    pendingLifetimeHours: readPositiveInt(
      settings.pendingLifetimeHours,
      DEFAULT_SIGNUP_SETTINGS.pendingLifetimeHours
    ),
    allowEmailOtpOnly: true,
    requireMobileNumber: true,
    loginIdentifierMode: "EMAIL_OR_MOBILE",
    marketingEmailsOptInDefault: Boolean(
      settings.marketingEmailsOptInDefault ?? DEFAULT_SIGNUP_SETTINGS.marketingEmailsOptInDefault
    ),
    turnstileSuspiciousAttemptThreshold: readPositiveInt(
      settings.turnstileSuspiciousAttemptThreshold,
      DEFAULT_SIGNUP_SETTINGS.turnstileSuspiciousAttemptThreshold
    ),
    signupReviewMessage: readString(
      settings.signupReviewMessage,
      DEFAULT_SIGNUP_SETTINGS.signupReviewMessage
    ),
    oneAccountWarningText: readString(
      settings.oneAccountWarningText,
      DEFAULT_SIGNUP_SETTINGS.oneAccountWarningText
    ),
  };
}

function mapVersion(version: NonNullable<Awaited<ReturnType<typeof findSignupSettingsVersionById>>>) {
  return {
    id: version.id,
    versionNumber: version.versionNumber,
    status: version.status,
    title: version.title,
    summary: version.summary,
    settings: resolveSignupSettings(version.settings),
    publishedAt: version.publishedAt,
    createdAt: version.createdAt,
    updatedAt: version.updatedAt,
  };
}

export async function listAdminSignupSettings(session: AdminSessionLike) {
  assertAdmin(session);

  const versions = await findSignupSettingsVersions();

  const safeVersions = versions.map((version) => ({
    id: version.id,
    versionNumber: version.versionNumber,
    status: version.status,
    title: version.title,
    summary: version.summary,
    settings: resolveSignupSettings(version.settings),
    publishedAt: version.publishedAt,
    createdAt: version.createdAt,
    updatedAt: version.updatedAt,
  }));

  const latestPublished =
    safeVersions.find((item) => item.status === ContentVersionStatus.PUBLISHED) ?? null;
  const draftVersion =
    safeVersions.find((item) => item.status === ContentVersionStatus.DRAFT) ?? null;

  return {
    latestPublishedVersionId: latestPublished?.id ?? null,
    latestPublishedVersionNumber: latestPublished?.versionNumber ?? null,
    draftVersionId: draftVersion?.id ?? null,
    versions: safeVersions,
  };
}

export async function createSignupSettingsDraft(session: AdminSessionLike) {
  assertAdmin(session);

  const existingDraft = await findDraftSignupSettingsVersion();
  if (existingDraft) {
    throw new AppError("A signup settings draft already exists", 409);
  }

  const versions = await findSignupSettingsVersions();
  const latestVersionNumber = versions.reduce((max, item) => Math.max(max, item.versionNumber), 0);
  const latestPublished =
    versions.find((item) => item.status === ContentVersionStatus.PUBLISHED) ?? null;

  const baseSettings = latestPublished
    ? resolveSignupSettings(latestPublished.settings)
    : DEFAULT_SIGNUP_SETTINGS;

  const draft = await createSignupSettingsVersion({
    versionNumber: latestVersionNumber + 1,
    status: ContentVersionStatus.DRAFT,
    title: latestPublished?.title ?? "Signup Settings",
    summary: latestPublished?.summary ?? "Draft signup settings version",
    settings: baseSettings as Prisma.InputJsonValue,
    publishedAt: null,
  });

  return {
    version: mapVersion(draft),
  };
}

export async function updateSignupSettingsDraft(
  session: AdminSessionLike,
  versionId: string,
  input: {
    title: string;
    summary?: string;
    settings: SignupSettingsConfig;
  }
) {
  assertAdmin(session);

  const existing = await findSignupSettingsVersionById(versionId);
  if (!existing) {
    throw new AppError("Signup settings version not found", 404);
  }

  if (existing.status !== ContentVersionStatus.DRAFT) {
    throw new AppError("Only draft signup settings can be edited", 409);
  }

  const updated = await updateSignupSettingsVersion(versionId, {
    title: input.title,
    summary: input.summary?.trim() || null,
    settings: input.settings as Prisma.InputJsonValue,
  });

  return {
    version: mapVersion(updated),
  };
}

export async function publishSignupSettingsDraft(
  session: AdminSessionLike,
  versionId: string
) {
  assertAdmin(session);

  const existing = await findSignupSettingsVersionById(versionId);
  if (!existing) {
    throw new AppError("Signup settings version not found", 404);
  }

  if (existing.status !== ContentVersionStatus.DRAFT) {
    throw new AppError("Only draft signup settings can be published", 409);
  }

  const published = await updateSignupSettingsVersion(versionId, {
    status: ContentVersionStatus.PUBLISHED,
    publishedAt: new Date(),
  });

  return {
    version: mapVersion(published),
  };
}

export async function restoreSignupSettingsAsNewPublishedCopy(
  session: AdminSessionLike,
  versionId: string
) {
  assertAdmin(session);

  const source = await findSignupSettingsVersionById(versionId);
  if (!source) {
    throw new AppError("Signup settings version not found", 404);
  }

  if (source.status === ContentVersionStatus.DRAFT) {
    throw new AppError("Draft version cannot be restored as published copy", 409);
  }

  const versions = await findSignupSettingsVersions();
  const latestVersionNumber = versions.reduce((max, item) => Math.max(max, item.versionNumber), 0);

  const restored = await createSignupSettingsVersion({
    versionNumber: latestVersionNumber + 1,
    status: ContentVersionStatus.PUBLISHED,
    title: source.title,
    summary: source.summary,
    settings: resolveSignupSettings(source.settings) as Prisma.InputJsonValue,
    publishedAt: new Date(),
  });

  return {
    version: mapVersion(restored),
    restoredFromVersionId: source.id,
    restoredFromVersionNumber: source.versionNumber,
  };
}
