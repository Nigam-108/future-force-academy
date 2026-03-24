import { comparePassword, hashPassword } from "@/server/auth/password";
import { generateNumericOtp, hashOtp } from "@/server/auth/otp";
import { AppError } from "@/server/utils/errors";
import {
  maskEmail,
  normalizeEmail,
} from "@/server/utils/auth-normalizers";
import { findPendingSignupByNormalizedEmail } from "@/server/repositories/signup-v2.repository";
import { findUserByEmail, updateUserPassword } from "@/server/repositories/user.repository";
import {
  createPasswordResetToken,
  findLatestActivePasswordResetToken,
  findValidPasswordResetTokenByHash,
  invalidateActivePasswordResetTokens,
  markPasswordResetTokenUsed,
} from "@/server/repositories/password-reset.repository";
import { sendPasswordResetOtpEmail } from "@/server/services/password-reset-email.service";

const RESET_OTP_LENGTH = 6;
const RESET_OTP_EXPIRY_MINUTES = 10;
const RESET_RESEND_COOLDOWN_SECONDS = 60;

export async function startPasswordReset(input: { email: string }) {
  const normalizedEmail = normalizeEmail(input.email);
  const now = new Date();

  const pendingSignup = await findPendingSignupByNormalizedEmail(normalizedEmail);

  if (pendingSignup && pendingSignup.expiresAt.getTime() > now.getTime()) {
    throw new AppError(
      "Account not created yet. Complete email verification first.",
      409
    );
  }

  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    throw new AppError("No account found with this email", 404);
  }

  const latestActiveToken = await findLatestActivePasswordResetToken(user.id);

  if (
    latestActiveToken &&
    latestActiveToken.createdAt.getTime() + RESET_RESEND_COOLDOWN_SECONDS * 1000 > now.getTime()
  ) {
    throw new AppError("Please wait before requesting another reset OTP", 429);
  }

  await invalidateActivePasswordResetTokens(user.id);

  const otp = generateNumericOtp(RESET_OTP_LENGTH);

  try {
    await sendPasswordResetOtpEmail({
      email: normalizedEmail,
      otp,
      expiresInMinutes: RESET_OTP_EXPIRY_MINUTES,
    });
  } catch {
    throw new AppError("We could not send the reset OTP right now. Please try again.", 503);
  }

  const passwordResetToken = await createPasswordResetToken({
    userId: user.id,
    tokenHash: hashOtp(otp),
    expiresAt: new Date(now.getTime() + RESET_OTP_EXPIRY_MINUTES * 60 * 1000),
  });

  return {
    maskedEmail: maskEmail(normalizedEmail),
    otpLength: RESET_OTP_LENGTH,
    otpExpiresAt: passwordResetToken.expiresAt,
    resendAvailableAt: new Date(now.getTime() + RESET_RESEND_COOLDOWN_SECONDS * 1000),
  };
}

export async function resetPasswordWithOtp(input: {
  email: string;
  otp: string;
  newPassword: string;
}) {
  const normalizedEmail = normalizeEmail(input.email);
  const now = new Date();

  const pendingSignup = await findPendingSignupByNormalizedEmail(normalizedEmail);

  if (pendingSignup && pendingSignup.expiresAt.getTime() > now.getTime()) {
    throw new AppError(
      "Account not created yet. Complete email verification first.",
      409
    );
  }

  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    throw new AppError("No account found with this email", 404);
  }

  const matchingToken = await findValidPasswordResetTokenByHash(
    user.id,
    hashOtp(input.otp)
  );

  if (!matchingToken) {
    throw new AppError("Invalid or expired OTP", 400);
  }

  const isSameAsCurrentPassword = await comparePassword(
    input.newPassword,
    user.passwordHash
  );

  if (isSameAsCurrentPassword) {
    throw new AppError("New password must be different from the current password", 422);
  }

  const passwordHash = await hashPassword(input.newPassword);

  await updateUserPassword(user.id, passwordHash);
  await markPasswordResetTokenUsed(matchingToken.id);
  await invalidateActivePasswordResetTokens(user.id);

  return {
    redirectTo: "/login",
    loginRedirectDelaySeconds: 3,
  };
}