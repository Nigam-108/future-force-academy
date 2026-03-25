import { getEmailProvider } from "@/server/config/email";
import { sendConsoleEmail } from "@/server/email/providers/console.provider";
import { sendResendEmail } from "@/server/email/providers/resend.provider";
import { SendEmailInput, SendEmailResult } from "@/server/email/types";

// ─── Main sendEmail function — routes to correct provider ─────────────────────
// All email sending in the app goes through this single function
// Provider is controlled by EMAIL_PROVIDER env variable
// "console" → prints to terminal (local dev)
// "resend"  → sends real email via Resend REST API (production)
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const provider = getEmailProvider();

  if (provider === "resend") {
    return sendResendEmail(input);
  }

  return sendConsoleEmail(input);
}