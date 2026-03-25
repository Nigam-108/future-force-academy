// ─── Shared email types used by all providers and templates ───────────────────

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  // Optional tags for tracking in Resend dashboard
  tags?: Array<{
    name: string;
    value: string;
  }>;
};

export type SendEmailResult = {
  success: boolean;
  provider: "console" | "resend";
  messageId?: string;
  error?: string;
};