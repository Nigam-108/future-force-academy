import { wrapEmailHtml, escapeHtml } from "@/server/email/templates/base";

// ─── Policy update email template ─────────────────────────────────────────────
// Sent when admin updates Terms / Privacy / Refund policies
// Supports multiple policies in one email (each gets its own card)
export function buildPolicyUpdateEmail(input: {
  userName?: string;
  updatedPolicies: Array<{
    label: string;   // e.g. "Privacy Policy"
    title: string;   // full policy title
    summary: string; // short description of what changed
    viewUrl: string; // link to view the updated policy
  }>;
}) {
  const greetingName = input.userName?.trim() || "Student";

  // Build a card for each updated policy
  const policiesHtml = input.updatedPolicies.map((policy) => `
    <div style="margin:0 0 16px 0;padding:16px;border:1px solid #e2e8f0;border-radius:18px;background:#f8fafc;">
      <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#2563eb;">
        ${escapeHtml(policy.label)}
      </p>
      <p style="margin:0 0 10px 0;font-size:16px;font-weight:700;color:#0f172a;">
        ${escapeHtml(policy.title)}
      </p>
      <p style="margin:0 0 14px 0;font-size:14px;line-height:1.7;color:#475569;">
        ${escapeHtml(policy.summary)}
      </p>
      <a href="${policy.viewUrl}" style="display:inline-block;padding:10px 14px;border-radius:14px;background:#0f172a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">
        View Updated Policy
      </a>
    </div>
  `).join("");

  const html = wrapEmailHtml({
    preheader: "Important policy updates are available on your account",
    title:     "Policy Updates",
    heading:   "Important policy updates",
    bodyHtml: `
      <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#334155;">
        Hello ${escapeHtml(greetingName)},
      </p>
      <p style="margin:0 0 18px 0;font-size:15px;line-height:1.7;color:#334155;">
        We have updated one or more Future Force Academy policies. Please review the latest versions below.
      </p>
      ${policiesHtml}
    `,
  });

  const text = [
    `Hello ${greetingName},`,
    ``,
    `We have updated one or more Future Force Academy policies.`,
    ...input.updatedPolicies.flatMap((policy) => [
      ``,
      `${policy.label}: ${policy.title}`,
      `${policy.summary}`,
      `${policy.viewUrl}`,
    ]),
  ].join("\n");

  return {
    subject: "Important Future Force Academy policy updates",
    html,
    text,
  };
}