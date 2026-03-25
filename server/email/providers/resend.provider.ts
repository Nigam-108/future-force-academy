import {
  getEmailFrom,
  getEmailReplyTo,
  getResendApiKey,
  isResendConfigured,
} from "@/server/config/email";
import { SendEmailInput, SendEmailResult } from "@/server/email/types";
import { AppError } from "@/server/utils/errors";

// ─── Resend API response shape ─────────────────────────────────────────────────
type ResendSendEmailResponse = {
  id?: string;
  object?: string;
  error?: {
    message?: string;
    name?: string;
  };
};

// ─── Resend provider — production email sending via REST API ──────────────────
// Uses direct fetch to Resend's REST API — no npm package needed
// Resend docs: https://resend.com/docs/send-with-nodejs
// IMPORTANT: domain must be verified in Resend before real emails will send
export async function sendResendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  // Throw early if Resend is not configured properly
  if (!isResendConfigured()) {
    throw new AppError("Resend is not configured", 500);
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getResendApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from:     getEmailFrom(),
      to:       Array.isArray(input.to) ? input.to : [input.to],
      subject:  input.subject,
      html:     input.html,
      text:     input.text,
      reply_to: input.replyTo || getEmailReplyTo(),
      tags:     input.tags,
    }),
    cache: "no-store",
  });

  const result = (await response.json()) as ResendSendEmailResponse;

  // Resend returns error object if sending failed
  if (!response.ok || result.error) {
    return {
      success: false,
      provider: "resend",
      error: result.error?.message || "Resend send failed",
    };
  }

  return {
    success: true,
    provider: "resend",
    messageId: result.id,
  };
}