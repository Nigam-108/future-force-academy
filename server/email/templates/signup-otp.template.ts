import { otpCodeBlock, wrapEmailHtml, escapeHtml } from "@/server/email/templates/base";

// ─── Signup OTP email template ─────────────────────────────────────────────────
// Sent when student starts signup and needs to verify their email
export function buildSignupOtpEmail(input: {
  firstName: string;
  otp: string;
  expiresInMinutes: number;
}) {
  const safeName = input.firstName.trim() || "Student";

  const html = wrapEmailHtml({
    preheader: `Your signup OTP is ${input.otp}`,
    title:     "Signup OTP",
    heading:   "Verify your email",
    bodyHtml: `
      <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#334155;">
        Hello ${escapeHtml(safeName)},
      </p>
      <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#334155;">
        Use the OTP below to complete your Future Force Academy signup.
      </p>
      ${otpCodeBlock(input.otp)}
      <p style="margin:0 0 10px 0;font-size:15px;line-height:1.7;color:#334155;">
        This OTP will expire in <strong>${input.expiresInMinutes} minutes</strong>.
      </p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#64748b;">
        If you did not request this signup, you can ignore this email.
      </p>
    `,
  });

  const text = [
    `Hello ${safeName},`,
    ``,
    `Use this OTP to complete your Future Force Academy signup: ${input.otp}`,
    `This OTP will expire in ${input.expiresInMinutes} minutes.`,
    ``,
    `If you did not request this signup, you can ignore this email.`,
  ].join("\n");

  return {
    subject: "Verify your Future Force Academy signup",
    html,
    text,
  };
}