import { getEmailFrom, getEmailReplyTo } from "@/server/config/email";
import { SendEmailInput, SendEmailResult } from "@/server/email/types";

// ─── Console provider — local/dev only ────────────────────────────────────────
// Prints the email to terminal instead of actually sending it
// Safe for local dev — no real emails sent, no API key needed
export async function sendConsoleEmail(input: SendEmailInput): Promise<SendEmailResult> {
  console.log("📧 DEV EMAIL");
  console.log(`From: ${getEmailFrom()}`);
  console.log(`To: ${Array.isArray(input.to) ? input.to.join(", ") : input.to}`);
  console.log(`Reply-To: ${input.replyTo || getEmailReplyTo() || "---"}`);
  console.log(`Subject: ${input.subject}`);
  console.log("Text:");
  console.log(input.text);
  console.log("HTML:");
  console.log(input.html);

  return {
    success: true,
    provider: "console",
    messageId: `console-${Date.now()}`,
  };
}