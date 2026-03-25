// ─── Email provider config ─────────────────────────────────────────────────────
// Controls which email provider is used based on EMAIL_PROVIDER env variable
// "console" = local dev, prints to terminal
// "resend"  = production, sends real emails via Resend REST API

export type EmailProvider = "console" | "resend";

// Read EMAIL_PROVIDER from env — defaults to "console" if not set
export function getEmailProvider(): EmailProvider {
  const provider = (process.env.EMAIL_PROVIDER ?? "console").trim().toLowerCase();
  if (provider === "resend") return "resend";
  return "console";
}

// From address shown in email — e.g. "Future Force Academy <noreply@yourdomain.com>"
export function getEmailFrom() {
  return process.env.EMAIL_FROM?.trim() || "Future Force Academy <noreply@example.com>";
}

// Optional reply-to address
export function getEmailReplyTo() {
  return process.env.EMAIL_REPLY_TO?.trim() || undefined;
}

// Resend API key from env
export function getResendApiKey() {
  return process.env.RESEND_API_KEY?.trim() || "";
}

// Returns true only if provider is resend AND API key is set
export function isResendConfigured() {
  return Boolean(getResendApiKey()) && getEmailProvider() === "resend";
}