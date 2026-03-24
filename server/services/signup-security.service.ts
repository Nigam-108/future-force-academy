import { AuthAttemptStatus, AuthAttemptType } from "@prisma/client";
import { AppError } from "@/server/utils/errors";
import { getTurnstileSiteKey, isTurnstileEnabled, getSignupSecurityWindowMinutes } from "@/server/config/security";
import { verifyTurnstileToken } from "@/server/security/turnstile";
import { countRecentAuthAttempts } from "@/server/repositories/auth-attempt.repository";
import { createAuthAttempt, findPublishedSignupSettingsVersion } from "@/server/repositories/signup-v2.repository";

function readPositiveInt(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : fallback;
}

async function getSuspiciousThreshold() {
  const published = await findPublishedSignupSettingsVersion();
  const rawSettings =
    published && typeof published.settings === "object" && published.settings
      ? (published.settings as Record<string, unknown>)
      : {};

  return readPositiveInt(rawSettings.turnstileSuspiciousAttemptThreshold, 3);
}

async function logSecurityAttemptSafe(input: {
  type: AuthAttemptType;
  status: AuthAttemptStatus;
  email?: string;
  mobileNumber?: string;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
}) {
  try {
    await createAuthAttempt({
      type: input.type,
      status: input.status,
      email: input.email,
      mobileNumber: input.mobileNumber,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      reason: input.reason,
    });
  } catch {
    // never block auth flow on audit logging
  }
}

export async function getSignupSecurityPublicConfig() {
  const threshold = await getSuspiciousThreshold();

  return {
    turnstileEnabled: isTurnstileEnabled(),
    turnstileSiteKey: isTurnstileEnabled() ? getTurnstileSiteKey() : "",
    suspiciousWindowMinutes: getSignupSecurityWindowMinutes(),
    suspiciousThreshold: threshold,
  };
}

export async function getSignupSecurityRequirement(input: {
  email?: string;
  mobileNumber?: string;
  ipAddress?: string;
}) {
  const threshold = await getSuspiciousThreshold();

  if (!isTurnstileEnabled()) {
    return {
      turnstileEnabled: false,
      turnstileSiteKey: "",
      turnstileRequired: false,
      recentAttemptCount: 0,
      suspiciousWindowMinutes: getSignupSecurityWindowMinutes(),
      suspiciousThreshold: threshold,
    };
  }

  const since = new Date(
    Date.now() - getSignupSecurityWindowMinutes() * 60 * 1000
  );

  const recentAttemptCount = await countRecentAuthAttempts({
    since,
    types: [
      AuthAttemptType.SIGNUP_AVAILABILITY,
      AuthAttemptType.SIGNUP_START,
      AuthAttemptType.SIGNUP_RESEND,
      AuthAttemptType.SIGNUP_VERIFY,
    ],
    statuses: [AuthAttemptStatus.FAILED, AuthAttemptStatus.BLOCKED],
    email: input.email,
    mobileNumber: input.mobileNumber,
    ipAddress: input.ipAddress,
  });

  return {
    turnstileEnabled: true,
    turnstileSiteKey: getTurnstileSiteKey(),
    turnstileRequired: recentAttemptCount >= threshold,
    recentAttemptCount,
    suspiciousWindowMinutes: getSignupSecurityWindowMinutes(),
    suspiciousThreshold: threshold,
  };
}

export async function assertSignupTurnstileOrThrow(input: {
  email?: string;
  mobileNumber?: string;
  turnstileToken?: string;
  ipAddress?: string;
  userAgent?: string;
  actionType: AuthAttemptType;
}) {
  const requirement = await getSignupSecurityRequirement({
    email: input.email,
    mobileNumber: input.mobileNumber,
    ipAddress: input.ipAddress,
  });

  if (!requirement.turnstileRequired) {
    return {
      turnstileRequired: false,
      verified: false,
    };
  }

  if (!input.turnstileToken?.trim()) {
    await logSecurityAttemptSafe({
      type: input.actionType,
      status: AuthAttemptStatus.BLOCKED,
      email: input.email,
      mobileNumber: input.mobileNumber,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      reason: "TURNSTILE_REQUIRED",
    });

    throw new AppError("Security check required. Complete Turnstile and try again.", 428);
  }

  const verified = await verifyTurnstileToken({
    token: input.turnstileToken,
    ipAddress: input.ipAddress,
  });

  if (!verified.success) {
    await logSecurityAttemptSafe({
      type: input.actionType,
      status: AuthAttemptStatus.FAILED,
      email: input.email,
      mobileNumber: input.mobileNumber,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      reason: `TURNSTILE_FAILED:${verified.errorCodes.join(",") || "unknown"}`,
    });

    throw new AppError("Security verification failed. Please retry Turnstile.", 422);
  }

  return {
    turnstileRequired: true,
    verified: true,
  };
}
