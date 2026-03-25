import { sendEmail } from "@/server/email/send-email";
import { buildPasswordResetOtpEmail } from "@/server/email/templates/password-reset-otp.template";
import { AppError } from "@/server/utils/errors";

type SendPasswordResetOtpEmailInput = {
  email: string;
  otp: string;
  expiresInMinutes: number;
};

// ─── Send password reset OTP email ────────────────────────────────────────────
// Called during forgot-password flow
// Routes to console (dev) or Resend (production) based on EMAIL_PROVIDER env
export async function sendPasswordResetOtpEmail(input: SendPasswordResetOtpEmailInput) {
  const template = buildPasswordResetOtpEmail({
    otp:              input.otp,
    expiresInMinutes: input.expiresInMinutes,
  });

  const result = await sendEmail({
    to:      input.email,
    subject: template.subject,
    html:    template.html,
    text:    template.text,
    tags: [
      { name: "category", value: "password-reset-otp" },
      { name: "channel",  value: "auth" },
    ],
  });

  if (!result.success) {
    throw new AppError(result.error || "Failed to send password reset OTP email", 503);
  }

  return result;
}