import { sendEmail } from "@/server/email/send-email";
import { buildSignupOtpEmail } from "@/server/email/templates/signup-otp.template";
import { AppError } from "@/server/utils/errors";

type SendSignupOtpEmailInput = {
  email: string;
  firstName: string;
  otp: string;
  expiresInMinutes: number;
};

// ─── Send signup OTP email ─────────────────────────────────────────────────────
// Called during signup flow when student needs to verify their email
// Routes to console (dev) or Resend (production) based on EMAIL_PROVIDER env
export async function sendSignupOtpEmail(input: SendSignupOtpEmailInput) {
  const template = buildSignupOtpEmail({
    firstName:        input.firstName,
    otp:              input.otp,
    expiresInMinutes: input.expiresInMinutes,
  });

  const result = await sendEmail({
    to:      input.email,
    subject: template.subject,
    html:    template.html,
    text:    template.text,
    tags: [
      { name: "category", value: "signup-otp" },
      { name: "channel",  value: "auth" },
    ],
  });

  // Throw if sending failed — caller handles the error
  if (!result.success) {
    throw new AppError(result.error || "Failed to send signup OTP email", 503);
  }

  return result;
}