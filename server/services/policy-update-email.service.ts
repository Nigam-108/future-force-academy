import { sendEmail } from "@/server/email/send-email";
import { buildPolicyUpdateEmail } from "@/server/email/templates/policy-update.template";
import { AppError } from "@/server/utils/errors";

// ─── Send policy update email ──────────────────────────────────────────────────
// Called when admin updates Terms / Privacy / Refund policies
// Can include multiple policy updates in a single email
export async function sendPolicyUpdateEmail(input: {
  to: string;
  userName?: string;
  updatedPolicies: Array<{
    label: string;
    title: string;
    summary: string;
    viewUrl: string;
  }>;
}) {
  const template = buildPolicyUpdateEmail({
    userName:        input.userName,
    updatedPolicies: input.updatedPolicies,
  });

  const result = await sendEmail({
    to:      input.to,
    subject: template.subject,
    html:    template.html,
    text:    template.text,
    tags: [
      { name: "category", value: "policy-update" },
      { name: "channel",  value: "legal" },
    ],
  });

  if (!result.success) {
    throw new AppError(result.error || "Failed to send policy update email", 503);
  }

  return result;
}