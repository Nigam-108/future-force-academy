import { Prisma } from "@prisma/client";
import { hashPassword } from "@/server/auth/password";
import { generateNumericOtp, hashOtp, verifyOtpHash } from "@/server/auth/otp";
import { AppError } from "@/server/utils/errors";
import {
  isValidEmailFormat,
  isValidIndianMobileNumber,
  maskEmail,
  normalizeEmail,
  normalizeHumanName,
  normalizeMobileNumber,
} from "@/server/utils/auth-normalizers";
import {
  createAuthAttempt,
  createPendingSignup,
  createVerifiedUserFromPendingSignup,
  findPendingSignupByNormalizedEmail,
  findPendingSignupByNormalizedMobileNumber,
  findPublishedPolicyVersions,
  findPublishedSignupSettingsVersion,
  findRegisteredUserByEmail,
  findRegisteredUserByMobileNumber,
  PendingSignupWithRelations,
  updatePendingSignup,
} from "@/server/repositories/signup-v2.repository";
import { sendSignupOtpEmail } from "@/server/services/signup-email.service";

export type SignupRequestContext = {
  ipAddress?: string;
  userAgent?: string;
  sourceContext?: string;
};

type SignupRuntimeSettings = {
  otpLength: number;
  otpExpiryMinutes: number;
  resendCooldownSeconds: number;
  resendLimit: number;
  resendWindowMinutes: number;
  resendBlockMinutes: number;
  wrongAttemptLimit: number;
  wrongAttemptBlockMinutes: number;
  pendingLifetimeHours: number;
  allowEmailOtpOnly: boolean;
  requireMobileNumber: boolean;
  loginIdentifierMode: string;
  marketingEmailsOptInDefault: boolean;
  turnstileSuspiciousAttemptThreshold: number;
  signupReviewMessage: string;
  oneAccountWarningText: string;
};


const DEFAULT_SIGNUP_SETTINGS: SignupRuntimeSettings = {
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
  signupReviewMessage: "Please review your details carefully before sending OTP.",
  oneAccountWarningText: "Only one account is allowed per email and mobile number.",
};


function readPositiveInt(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function resolveSignupRuntimeSettings(rawSettings: unknown): SignupRuntimeSettings {
  if (!rawSettings || typeof rawSettings !== "object") {
    return DEFAULT_SIGNUP_SETTINGS;
  }

  const settings = rawSettings as Record<string, unknown>;

  return {
    otpLength: readPositiveInt(settings.otpLength, DEFAULT_SIGNUP_SETTINGS.otpLength),
    otpExpiryMinutes: readPositiveInt(settings.otpExpiryMinutes, DEFAULT_SIGNUP_SETTINGS.otpExpiryMinutes),
    resendCooldownSeconds: readPositiveInt(settings.resendCooldownSeconds, DEFAULT_SIGNUP_SETTINGS.resendCooldownSeconds),
    resendLimit: readPositiveInt(settings.resendLimit, DEFAULT_SIGNUP_SETTINGS.resendLimit),
    resendWindowMinutes: readPositiveInt(settings.resendWindowMinutes, DEFAULT_SIGNUP_SETTINGS.resendWindowMinutes),
    resendBlockMinutes: readPositiveInt(settings.resendBlockMinutes, DEFAULT_SIGNUP_SETTINGS.resendBlockMinutes),
    wrongAttemptLimit: readPositiveInt(settings.wrongAttemptLimit, DEFAULT_SIGNUP_SETTINGS.wrongAttemptLimit),
    wrongAttemptBlockMinutes: readPositiveInt(settings.wrongAttemptBlockMinutes, DEFAULT_SIGNUP_SETTINGS.wrongAttemptBlockMinutes),
    pendingLifetimeHours: readPositiveInt(settings.pendingLifetimeHours, DEFAULT_SIGNUP_SETTINGS.pendingLifetimeHours),
    allowEmailOtpOnly: Boolean(settings.allowEmailOtpOnly ?? DEFAULT_SIGNUP_SETTINGS.allowEmailOtpOnly),
    requireMobileNumber: Boolean(settings.requireMobileNumber ?? DEFAULT_SIGNUP_SETTINGS.requireMobileNumber),
    loginIdentifierMode: String(settings.loginIdentifierMode ?? DEFAULT_SIGNUP_SETTINGS.loginIdentifierMode),
    marketingEmailsOptInDefault: Boolean(
      settings.marketingEmailsOptInDefault ?? DEFAULT_SIGNUP_SETTINGS.marketingEmailsOptInDefault
    ),
    turnstileSuspiciousAttemptThreshold: readPositiveInt(
      settings.turnstileSuspiciousAttemptThreshold,
      DEFAULT_SIGNUP_SETTINGS.turnstileSuspiciousAttemptThreshold
    ),
    signupReviewMessage: String(
  settings.signupReviewMessage ?? DEFAULT_SIGNUP_SETTINGS.signupReviewMessage
),
oneAccountWarningText: String(
  settings.oneAccountWarningText ?? DEFAULT_SIGNUP_SETTINGS.oneAccountWarningText
),

  };
}

async function logAuthAttemptSafe(input: {
  type:
    | "SIGNUP_AVAILABILITY"
    | "SIGNUP_START"
    | "SIGNUP_CONTINUE"
    | "SIGNUP_RESEND"
    | "SIGNUP_VERIFY";
  status: "SUCCESS" | "FAILED" | "BLOCKED";
  email?: string;
  mobileNumber?: string;
  pendingSignupId?: string;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  try {
    await createAuthAttempt({
      type: input.type,
      status: input.status,
      email: input.email,
      mobileNumber: input.mobileNumber,
      pendingSignupId: input.pendingSignupId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      reason: input.reason,
      metadata: input.metadata,
    });
  } catch {
    // never block signup flow due to audit logging
  }
}

type PublishedPolicyVersions = {
  terms: NonNullable<Awaited<ReturnType<typeof findPublishedPolicyVersions>>["terms"]>;
  privacy: NonNullable<Awaited<ReturnType<typeof findPublishedPolicyVersions>>["privacy"]>;
  refund: NonNullable<Awaited<ReturnType<typeof findPublishedPolicyVersions>>["refund"]>;
};

type PublishedSignupFoundation = {
  signupSettingsVersion: NonNullable<Awaited<ReturnType<typeof findPublishedSignupSettingsVersion>>>;
  policies: PublishedPolicyVersions;
  settings: SignupRuntimeSettings;
};

async function getPublishedSignupFoundationOrThrow(): Promise<PublishedSignupFoundation> {
  const signupSettingsVersion = await findPublishedSignupSettingsVersion();
  const policies = await findPublishedPolicyVersions();

  if (!signupSettingsVersion) {
    throw new AppError("No published signup settings found", 500);
  }

  const terms = policies.terms;
  const privacy = policies.privacy;
  const refund = policies.refund;

  if (!terms || !privacy || !refund) {
    throw new AppError("Published policy versions are missing", 500);
  }

  return {
    signupSettingsVersion,
    policies: {
      terms,
      privacy,
      refund,
    },
    settings: resolveSignupRuntimeSettings(signupSettingsVersion.settings),
  };
}

function assertValidMobileNumber(normalizedMobileNumber: string) {
  if (!isValidIndianMobileNumber(normalizedMobileNumber)) {
    throw new AppError("Mobile number must be a valid 10-digit Indian mobile number", 422);
  }
}

function isPendingExpired(pendingSignup: PendingSignupWithRelations, now: Date) {
  return pendingSignup.expiresAt.getTime() <= now.getTime();
}

export async function getSignupPublicConfig() {
  const { signupSettingsVersion, policies, settings } = await getPublishedSignupFoundationOrThrow();

  return {
    signupSettingsVersion: {
      id: signupSettingsVersion.id,
      versionNumber: signupSettingsVersion.versionNumber,
      title: signupSettingsVersion.title,
      summary: signupSettingsVersion.summary,
    },
    rules: settings,
    policies: {
      terms: {
        documentType: policies.terms.document.type,
        documentSlug: policies.terms.document.slug,
        versionId: policies.terms.id,
        versionNumber: policies.terms.versionNumber,
        title: policies.terms.title,
        summary: policies.terms.summary,
      },
      privacy: {
        documentType: policies.privacy.document.type,
        documentSlug: policies.privacy.document.slug,
        versionId: policies.privacy.id,
        versionNumber: policies.privacy.versionNumber,
        title: policies.privacy.title,
        summary: policies.privacy.summary,
      },
      refund: {
        documentType: policies.refund.document.type,
        documentSlug: policies.refund.document.slug,
        versionId: policies.refund.id,
        versionNumber: policies.refund.versionNumber,
        title: policies.refund.title,
        summary: policies.refund.summary,
      },
    },
  };
}

export async function checkSignupAvailability(input: {
  email?: string;
  mobileNumber?: string;
}) {
  const normalizedEmail = input.email ? normalizeEmail(input.email) : "";
  const normalizedMobileNumber = input.mobileNumber ? normalizeMobileNumber(input.mobileNumber) : "";

  const now = new Date();

  const emailResult = normalizedEmail
    ? isValidEmailFormat(normalizedEmail)
      ? await (async () => {
          const registeredUser = await findRegisteredUserByEmail(normalizedEmail);
          if (registeredUser) {
            return {
              status: "REGISTERED",
              available: false,
              message: "This email is already registered",
            };
          }

          const pendingSignup = await findPendingSignupByNormalizedEmail(normalizedEmail);
          if (pendingSignup && !isPendingExpired(pendingSignup, now)) {
            return {
              status: "PENDING",
              available: false,
              message: "A verification is already pending for this email",
              canContinueVerification: true,
              maskedEmail: maskEmail(normalizedEmail),
            };
          }

          return {
            status: "AVAILABLE",
            available: true,
            message: "Email is available",
          };
        })()
      : {
          status: "INVALID_FORMAT",
          available: false,
          message: "Enter a valid email address",
        }
    : {
        status: "NOT_CHECKED",
        available: false,
        message: "Email was not provided",
      };

  const mobileResult = normalizedMobileNumber
    ? isValidIndianMobileNumber(normalizedMobileNumber)
      ? await (async () => {
          const registeredUser = await findRegisteredUserByMobileNumber(normalizedMobileNumber);
          if (registeredUser) {
            return {
              status: "REGISTERED",
              available: false,
              message: "This mobile number is already registered",
            };
          }

          const pendingSignup = await findPendingSignupByNormalizedMobileNumber(normalizedMobileNumber);
          if (pendingSignup && !isPendingExpired(pendingSignup, now)) {
            return {
              status: "PENDING",
              available: false,
              message: "A verification is already pending for this mobile number",
            };
          }

          return {
            status: "AVAILABLE",
            available: true,
            message: "Mobile number is available",
          };
        })()
      : {
          status: "INVALID_FORMAT",
          available: false,
          message: "Enter a valid 10-digit Indian mobile number",
        }
    : {
        status: "NOT_CHECKED",
        available: false,
        message: "Mobile number was not provided",
      };

  return {
    email: emailResult,
    mobileNumber: mobileResult,
  };
}

export async function startSignup(
  input: {
    firstName: string;
    lastName?: string | null;
    email: string;
    mobileNumber: string;
    password: string;
    marketingEmailsEnabled?: boolean;
  },
  context: SignupRequestContext
) {
  const now = new Date();
  const normalizedEmail = normalizeEmail(input.email);
  const normalizedMobileNumber = normalizeMobileNumber(input.mobileNumber);
  const firstName = normalizeHumanName(input.firstName);
  const lastName = input.lastName ? normalizeHumanName(input.lastName) : null;

  assertValidMobileNumber(normalizedMobileNumber);

  const existingUserByEmail = await findRegisteredUserByEmail(normalizedEmail);
  if (existingUserByEmail) {
    await logAuthAttemptSafe({
      type: "SIGNUP_START",
      status: "FAILED",
      email: normalizedEmail,
      mobileNumber: normalizedMobileNumber,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      reason: "EMAIL_ALREADY_REGISTERED",
    });

    throw new AppError("This email is already registered", 409);
  }

  const existingUserByMobile = await findRegisteredUserByMobileNumber(normalizedMobileNumber);
  if (existingUserByMobile) {
    await logAuthAttemptSafe({
      type: "SIGNUP_START",
      status: "FAILED",
      email: normalizedEmail,
      mobileNumber: normalizedMobileNumber,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      reason: "MOBILE_ALREADY_REGISTERED",
    });

    throw new AppError("This mobile number is already registered", 409);
  }

  const emailPending = await findPendingSignupByNormalizedEmail(normalizedEmail);
  const mobilePending = await findPendingSignupByNormalizedMobileNumber(normalizedMobileNumber);

  if (emailPending && !isPendingExpired(emailPending, now)) {
    await logAuthAttemptSafe({
      type: "SIGNUP_START",
      status: "FAILED",
      email: normalizedEmail,
      mobileNumber: normalizedMobileNumber,
      pendingSignupId: emailPending.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      reason: "ACTIVE_PENDING_EMAIL_EXISTS",
    });

    throw new AppError("A verification is already pending for this email. Please continue verification.", 409);
  }

  if (mobilePending && !isPendingExpired(mobilePending, now)) {
    await logAuthAttemptSafe({
      type: "SIGNUP_START",
      status: "FAILED",
      email: normalizedEmail,
      mobileNumber: normalizedMobileNumber,
      pendingSignupId: mobilePending.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      reason: "ACTIVE_PENDING_MOBILE_EXISTS",
    });

    throw new AppError("A verification is already pending for this mobile number", 409);
  }

  const foundation = await getPublishedSignupFoundationOrThrow();
  const passwordHash = await hashPassword(input.password);

  const policyConsentSnapshot = {
    terms: {
      versionId: foundation.policies.terms.id,
      versionNumber: foundation.policies.terms.versionNumber,
      title: foundation.policies.terms.title,
      slug: foundation.policies.terms.document.slug,
    },
    privacy: {
      versionId: foundation.policies.privacy.id,
      versionNumber: foundation.policies.privacy.versionNumber,
      title: foundation.policies.privacy.title,
      slug: foundation.policies.privacy.document.slug,
    },
    refund: {
      versionId: foundation.policies.refund.id,
      versionNumber: foundation.policies.refund.versionNumber,
      title: foundation.policies.refund.title,
      slug: foundation.policies.refund.document.slug,
    },
  };

  const reusablePending = emailPending ?? mobilePending;

  const pendingSignup = reusablePending
    ? await updatePendingSignup(reusablePending.id, {
        firstName,
        lastName,
        email: normalizedEmail,
        normalizedEmail,
        mobileNumber: normalizedMobileNumber,
        normalizedMobileNumber,
        passwordHash,
        marketingEmailsEnabled: input.marketingEmailsEnabled ?? foundation.settings.marketingEmailsOptInDefault,
        termsAcceptedAt: now,
        privacyAcceptedAt: now,
        refundPolicyAcceptedAt: now,
        singleAccountConfirmed: true,
        singleAccountConfirmedAt: now,
        signupSettingsVersionId: foundation.signupSettingsVersion.id,
        signupSettingsSnapshot: foundation.signupSettingsVersion.settings as Prisma.InputJsonValue,
        termsPolicyVersionId: foundation.policies.terms.id,
        privacyPolicyVersionId: foundation.policies.privacy.id,
        refundPolicyVersionId: foundation.policies.refund.id,
        policyConsentSnapshot: policyConsentSnapshot as Prisma.InputJsonValue,
        otpHash: null,
        otpExpiresAt: null,
        otpLastSentAt: null,
        otpSendCount: 0,
        otpResendCount: 0,
        otpWindowStartedAt: null,
        wrongOtpCount: 0,
        verifyBlockedUntil: null,
        resendBlockedUntil: null,
        turnstileRequired: false,
        turnstileVerifiedAt: null,
        sourceContext: context.sourceContext,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        expiresAt: new Date(now.getTime() + foundation.settings.pendingLifetimeHours * 60 * 60 * 1000),
      })
    : await createPendingSignup({
        firstName,
        lastName,
        email: normalizedEmail,
        normalizedEmail,
        mobileNumber: normalizedMobileNumber,
        normalizedMobileNumber,
        passwordHash,
        marketingEmailsEnabled: input.marketingEmailsEnabled ?? foundation.settings.marketingEmailsOptInDefault,
        termsAcceptedAt: now,
        privacyAcceptedAt: now,
        refundPolicyAcceptedAt: now,
        singleAccountConfirmed: true,
        singleAccountConfirmedAt: now,
        signupSettingsVersionId: foundation.signupSettingsVersion.id,
        signupSettingsSnapshot: foundation.signupSettingsVersion.settings as Prisma.InputJsonValue,
        termsPolicyVersionId: foundation.policies.terms.id,
        privacyPolicyVersionId: foundation.policies.privacy.id,
        refundPolicyVersionId: foundation.policies.refund.id,
        policyConsentSnapshot: policyConsentSnapshot as Prisma.InputJsonValue,
        sourceContext: context.sourceContext,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        expiresAt: new Date(now.getTime() + foundation.settings.pendingLifetimeHours * 60 * 60 * 1000),
      });

  const otp = generateNumericOtp(foundation.settings.otpLength);

  try {
    await sendSignupOtpEmail({
      email: normalizedEmail,
      firstName,
      otp,
      expiresInMinutes: foundation.settings.otpExpiryMinutes,
    });
  } catch {
    await logAuthAttemptSafe({
      type: "SIGNUP_START",
      status: "FAILED",
      email: normalizedEmail,
      mobileNumber: normalizedMobileNumber,
      pendingSignupId: pendingSignup.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      reason: "OTP_EMAIL_SEND_FAILED",
    });

    throw new AppError("We could not send the verification code right now. Please retry.", 503);
  }

  const updatedPendingSignup = await updatePendingSignup(pendingSignup.id, {
    otpHash: hashOtp(otp),
    otpExpiresAt: new Date(now.getTime() + foundation.settings.otpExpiryMinutes * 60 * 1000),
    otpLastSentAt: now,
    otpSendCount: 1,
    otpResendCount: 0,
    otpWindowStartedAt: now,
    wrongOtpCount: 0,
    verifyBlockedUntil: null,
    resendBlockedUntil: null,
  });

  await logAuthAttemptSafe({
    type: "SIGNUP_START",
    status: "SUCCESS",
    email: normalizedEmail,
    mobileNumber: normalizedMobileNumber,
    pendingSignupId: updatedPendingSignup.id,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return {
    pendingSignupId: updatedPendingSignup.id,
    maskedEmail: maskEmail(updatedPendingSignup.normalizedEmail),
    otpExpiresAt: updatedPendingSignup.otpExpiresAt,
    resendAvailableAt: new Date(now.getTime() + foundation.settings.resendCooldownSeconds * 1000),
    pendingExpiresAt: updatedPendingSignup.expiresAt,
  };
}

export async function continuePendingSignup(
  input: { email: string },
  context: SignupRequestContext
) {
  const normalizedEmail = normalizeEmail(input.email);
  const pendingSignup = await findPendingSignupByNormalizedEmail(normalizedEmail);
  const now = new Date();

  if (!pendingSignup || isPendingExpired(pendingSignup, now)) {
    await logAuthAttemptSafe({
      type: "SIGNUP_CONTINUE",
      status: "FAILED",
      email: normalizedEmail,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      reason: "NO_ACTIVE_PENDING_SIGNUP",
    });

    throw new AppError("No active pending signup was found for this email", 404);
  }

  const settings = resolveSignupRuntimeSettings(pendingSignup.signupSettingsSnapshot);

  await logAuthAttemptSafe({
    type: "SIGNUP_CONTINUE",
    status: "SUCCESS",
    email: normalizedEmail,
    pendingSignupId: pendingSignup.id,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return {
    pendingSignupId: pendingSignup.id,
    maskedEmail: maskEmail(pendingSignup.normalizedEmail),
    otpExpiresAt: pendingSignup.otpExpiresAt,
    resendAvailableAt: pendingSignup.otpLastSentAt
      ? new Date(pendingSignup.otpLastSentAt.getTime() + settings.resendCooldownSeconds * 1000)
      : null,
    resendBlockedUntil: pendingSignup.resendBlockedUntil,
    pendingExpiresAt: pendingSignup.expiresAt,
  };
}

export async function resendSignupOtp(
  input: { email: string },
  context: SignupRequestContext
) {
  const normalizedEmail = normalizeEmail(input.email);
  const pendingSignup = await findPendingSignupByNormalizedEmail(normalizedEmail);
  const now = new Date();

  if (!pendingSignup || isPendingExpired(pendingSignup, now)) {
    await logAuthAttemptSafe({
      type: "SIGNUP_RESEND",
      status: "FAILED",
      email: normalizedEmail,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      reason: "NO_ACTIVE_PENDING_SIGNUP",
    });

    throw new AppError("No active pending signup was found for this email", 404);
  }

  const settings = resolveSignupRuntimeSettings(pendingSignup.signupSettingsSnapshot);

  if (pendingSignup.resendBlockedUntil && pendingSignup.resendBlockedUntil.getTime() > now.getTime()) {
    await logAuthAttemptSafe({
      type: "SIGNUP_RESEND",
      status: "BLOCKED",
      email: normalizedEmail,
      pendingSignupId: pendingSignup.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      reason: "RESEND_BLOCKED_WINDOW_ACTIVE",
    });

    throw new AppError("Resend limit reached. Please try again after 30 minutes.", 429);
  }

  if (
    pendingSignup.otpLastSentAt &&
    pendingSignup.otpLastSentAt.getTime() + settings.resendCooldownSeconds * 1000 > now.getTime()
  ) {
    throw new AppError("Please wait before requesting another OTP", 429);
  }

  let otpSendCount = pendingSignup.otpSendCount;
  let otpResendCount = pendingSignup.otpResendCount;
  let otpWindowStartedAt = pendingSignup.otpWindowStartedAt;

  if (
    !otpWindowStartedAt ||
    otpWindowStartedAt.getTime() + settings.resendWindowMinutes * 60 * 1000 <= now.getTime() ||
    (pendingSignup.resendBlockedUntil && pendingSignup.resendBlockedUntil.getTime() <= now.getTime())
  ) {
    otpSendCount = 0;
    otpResendCount = 0;
    otpWindowStartedAt = now;
  }

  if (otpSendCount >= settings.resendLimit) {
    await updatePendingSignup(pendingSignup.id, {
      resendBlockedUntil: new Date(now.getTime() + settings.resendBlockMinutes * 60 * 1000),
    });

    await logAuthAttemptSafe({
      type: "SIGNUP_RESEND",
      status: "BLOCKED",
      email: normalizedEmail,
      pendingSignupId: pendingSignup.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      reason: "RESEND_LIMIT_REACHED",
    });

    throw new AppError("Resend limit reached. Please try again after 30 minutes.", 429);
  }

  const otp = generateNumericOtp(settings.otpLength);

  try {
    await sendSignupOtpEmail({
      email: normalizedEmail,
      firstName: pendingSignup.firstName,
      otp,
      expiresInMinutes: settings.otpExpiryMinutes,
    });
  } catch {
    await logAuthAttemptSafe({
      type: "SIGNUP_RESEND",
      status: "FAILED",
      email: normalizedEmail,
      pendingSignupId: pendingSignup.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      reason: "OTP_EMAIL_SEND_FAILED",
    });

    throw new AppError("We could not send the verification code right now. Please retry.", 503);
  }

  const updatedPendingSignup = await updatePendingSignup(pendingSignup.id, {
    otpHash: hashOtp(otp),
    otpExpiresAt: new Date(now.getTime() + settings.otpExpiryMinutes * 60 * 1000),
    otpLastSentAt: now,
    otpSendCount: otpSendCount + 1,
    otpResendCount: otpResendCount + 1,
    otpWindowStartedAt,
    verifyBlockedUntil: null,
  });

  await logAuthAttemptSafe({
    type: "SIGNUP_RESEND",
    status: "SUCCESS",
    email: normalizedEmail,
    pendingSignupId: updatedPendingSignup.id,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return {
    maskedEmail: maskEmail(updatedPendingSignup.normalizedEmail),
    otpExpiresAt: updatedPendingSignup.otpExpiresAt,
    resendAvailableAt: new Date(now.getTime() + settings.resendCooldownSeconds * 1000),
    pendingExpiresAt: updatedPendingSignup.expiresAt,
  };
}

export async function verifySignupOtp(
  input: { email: string; otp: string },
  context: SignupRequestContext
) {
  const normalizedEmail = normalizeEmail(input.email);
  const pendingSignup = await findPendingSignupByNormalizedEmail(normalizedEmail);
  const now = new Date();

  if (!pendingSignup || isPendingExpired(pendingSignup, now)) {
    await logAuthAttemptSafe({
      type: "SIGNUP_VERIFY",
      status: "FAILED",
      email: normalizedEmail,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      reason: "NO_ACTIVE_PENDING_SIGNUP",
    });

    throw new AppError("Your pending signup has expired. Please start again.", 410);
  }

  const settings = resolveSignupRuntimeSettings(pendingSignup.signupSettingsSnapshot);

  if (pendingSignup.verifyBlockedUntil && pendingSignup.verifyBlockedUntil.getTime() > now.getTime()) {
    await logAuthAttemptSafe({
      type: "SIGNUP_VERIFY",
      status: "BLOCKED",
      email: normalizedEmail,
      pendingSignupId: pendingSignup.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      reason: "OTP_VERIFY_BLOCKED",
    });

    throw new AppError("Too many incorrect OTP attempts. Please try again after 5 minutes.", 429);
  }

  if (!pendingSignup.otpHash || !pendingSignup.otpExpiresAt) {
    throw new AppError("No active OTP found. Please send OTP again.", 400);
  }

  if (pendingSignup.otpExpiresAt.getTime() <= now.getTime()) {
    throw new AppError("OTP expired. Please send OTP again.", 400);
  }

  const existingUserByEmail = await findRegisteredUserByEmail(normalizedEmail);
  if (existingUserByEmail) {
    throw new AppError("This email is already registered", 409);
  }

  const existingUserByMobile = await findRegisteredUserByMobileNumber(pendingSignup.normalizedMobileNumber);
  if (existingUserByMobile) {
    throw new AppError("This mobile number is already registered", 409);
  }

  const isOtpValid = verifyOtpHash(input.otp, pendingSignup.otpHash);

  if (!isOtpValid) {
    const nextWrongCount = pendingSignup.wrongOtpCount + 1;
    const shouldBlock = nextWrongCount >= settings.wrongAttemptLimit;

    await updatePendingSignup(pendingSignup.id, {
      wrongOtpCount: nextWrongCount,
      verifyBlockedUntil: shouldBlock
        ? new Date(now.getTime() + settings.wrongAttemptBlockMinutes * 60 * 1000)
        : null,
    });

    await logAuthAttemptSafe({
      type: "SIGNUP_VERIFY",
      status: shouldBlock ? "BLOCKED" : "FAILED",
      email: normalizedEmail,
      pendingSignupId: pendingSignup.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      reason: shouldBlock ? "WRONG_OTP_LIMIT_REACHED" : "WRONG_OTP",
    });

    if (shouldBlock) {
      throw new AppError("Too many incorrect OTP attempts. Please try again after 5 minutes.", 429);
    }

    throw new AppError(`Invalid OTP. ${settings.wrongAttemptLimit - nextWrongCount} attempts remaining.`, 400);
  }

  const user = await createVerifiedUserFromPendingSignup({
    pendingSignup,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    sourceContext: context.sourceContext,
  });

  await logAuthAttemptSafe({
    type: "SIGNUP_VERIFY",
    status: "SUCCESS",
    email: normalizedEmail,
    mobileNumber: pendingSignup.normalizedMobileNumber,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    reason: "ACCOUNT_CREATED",
  });

  return {
    user,
    redirectTo: "/signup/success",
    loginRedirectDelaySeconds: 5,
  };
}