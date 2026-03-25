import { otpCodeBlock, wrapEmailHtml } from "@/server/email/templates/base";

// ─── Password reset OTP email template ────────────────────────────────────────
// Sent when student requests forgot-password OTP
export function buildPasswordResetOtpEmail(input: {
  otp: string;
  expiresInMinutes: number;
}) {
  const html = wrapEmailHtml({
    preheader: `Your password reset OTP is ${input.otp}`,
    title:     "Password Reset OTP",
    heading:   "Reset your password",
    bodyHtml: `
      <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#334155;">
        We received a password reset request for your Future Force Academy account.
      </p>
      ${otpCodeBlock(input.otp)}
      <p style="margin:0 0 10px 0;font-size:15px;line-height:1.7;color:#334155;">
        This OTP will expire in <strong>${input.expiresInMinutes} minutes</strong>.
      </p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#64748b;">
        If you did not request a password reset, please ignore this email and keep your password secure.
      </p>
    `,
  });

  const text = [
    `We received a password reset request for your Future Force Academy account.`,
    ``,
    `Use this OTP to reset your password: ${input.otp}`,
    `This OTP will expire in ${input.expiresInMinutes} minutes.`,
    ``,
    `If you did not request a password reset, please ignore this email.`,
  ].join("\n");

  return {
    subject: "Reset your Future Force Academy password",
    html,
    text,
  };
}