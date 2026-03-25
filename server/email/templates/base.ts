// ─── Base HTML email wrapper ───────────────────────────────────────────────────
// All email templates use this wrapper for consistent branding
// Dark header, white body, grey footer — Future Force Academy style

// Safely escapes HTML special characters to prevent XSS in emails
export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Wraps any email body in the branded HTML shell
export function wrapEmailHtml(input: {
  preheader?: string;  // preview text shown in inbox before opening
  title: string;
  heading: string;
  bodyHtml: string;
  footerText?: string;
}) {
  const footer =
    input.footerText ||
    "Future Force Academy — This is an automated email. Please do not reply to this message unless instructed.";

  return `
<!doctype html>
<html>
<head>
  <meta charSet="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(input.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">

  <!-- Preheader text — shown in inbox preview, hidden in email body -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${escapeHtml(input.preheader || input.title)}
  </div>

  <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;">

      <!-- Dark header with academy name + heading -->
      <div style="padding:24px 24px 8px 24px;background:#0f172a;color:#ffffff;">
        <p style="margin:0;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.85;">
          Future Force Academy
        </p>
        <h1 style="margin:12px 0 8px 0;font-size:28px;line-height:1.2;">
          ${escapeHtml(input.heading)}
        </h1>
      </div>

      <!-- Email body content -->
      <div style="padding:24px;">
        ${input.bodyHtml}
      </div>

      <!-- Footer -->
      <div style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;">
        <p style="margin:0;font-size:12px;line-height:1.6;color:#475569;">
          ${escapeHtml(footer)}
        </p>
      </div>

    </div>
  </div>
</body>
</html>`;
}

// ─── OTP code block — big styled OTP display used in auth emails ───────────────
export function otpCodeBlock(otp: string) {
  return `
<div style="margin:20px 0;padding:18px 16px;border:1px dashed #94a3b8;border-radius:18px;background:#f8fafc;text-align:center;">
  <p style="margin:0 0 10px 0;font-size:12px;color:#64748b;letter-spacing:0.15em;text-transform:uppercase;">
    One-Time Password
  </p>
  <p style="margin:0;font-size:32px;font-weight:700;letter-spacing:0.4em;color:#0f172a;">
    ${escapeHtml(otp)}
  </p>
</div>
`;
}