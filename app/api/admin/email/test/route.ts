import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/guards";
import { AppError } from "@/server/utils/errors";
import { adminTestEmailSchema } from "@/server/validations/admin-email.schema";
import { sendSignupOtpEmail } from "@/server/services/signup-email.service";
import { sendPasswordResetOtpEmail } from "@/server/services/password-reset-email.service";
import { sendPolicyUpdateEmail } from "@/server/services/policy-update-email.service";

// ─── POST /api/admin/email/test ────────────────────────────────────────────────
// Lets admin test any email template without triggering real auth flow
// Only ADMIN role can call this — useful for verifying Resend setup
// Body: { to: "email@example.com", type: "signup-otp" | "password-reset-otp" | "policy-update" }
export async function POST(request: NextRequest) {
  try {
    // Only ADMIN can test emails — not SUB_ADMIN
    const session = await requireAdmin("payment.manage");
    if (session.role !== "ADMIN") {
      return NextResponse.json({ message: "Only admin can send test emails" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = adminTestEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: parsed.error.flatten() },
        { status: 422 }
      );
    }

    let result;

    if (parsed.data.type === "signup-otp") {
      // Send a sample signup OTP email
      result = await sendSignupOtpEmail({
        email:            parsed.data.to,
        firstName:        "Nigam",
        otp:              "1234",
        expiresInMinutes: 10,
      });

    } else if (parsed.data.type === "password-reset-otp") {
      // Send a sample password reset OTP email
      result = await sendPasswordResetOtpEmail({
        email:            parsed.data.to,
        otp:              "654321",
        expiresInMinutes: 10,
      });

    } else {
      // Send a sample policy update email
      result = await sendPolicyUpdateEmail({
        to:       parsed.data.to,
        userName: "Nigam",
        updatedPolicies: [
          {
            label:   "Privacy Policy",
            title:   "Privacy Policy",
            summary: "We clarified verification metadata and security event handling.",
            viewUrl: "http://localhost:3000/privacy-policy?updated=1",
          },
        ],
      });
    }

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
      data:    result,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ message: "Failed to send test email" }, { status: 500 });
  }
}