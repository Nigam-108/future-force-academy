import { z } from "zod";

// ─── Validation schema for admin test email API ────────────────────────────────
export const adminTestEmailSchema = z.object({
  to:   z.string().trim().email("Enter a valid email address"),
  type: z.enum(["signup-otp", "password-reset-otp", "policy-update"]),
});