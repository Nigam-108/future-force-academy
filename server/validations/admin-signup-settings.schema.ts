import { z } from "zod";

export const updateSignupSettingsDraftSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  summary: z.string().trim().max(500).optional().or(z.literal("")),
  settings: z.object({
    otpLength: z.literal(4),
    otpExpiryMinutes: z.number().int().min(1).max(30),
    resendCooldownSeconds: z.number().int().min(30).max(300),
    resendLimit: z.number().int().min(1).max(10),
    resendWindowMinutes: z.number().int().min(1).max(60),
    resendBlockMinutes: z.number().int().min(1).max(120),
    wrongAttemptLimit: z.number().int().min(1).max(10),
    wrongAttemptBlockMinutes: z.number().int().min(1).max(60),
    pendingLifetimeHours: z.number().int().min(1).max(72),
    allowEmailOtpOnly: z.literal(true),
    requireMobileNumber: z.literal(true),
    loginIdentifierMode: z.literal("EMAIL_OR_MOBILE"),
    marketingEmailsOptInDefault: z.boolean(),
    turnstileSuspiciousAttemptThreshold: z.number().int().min(1).max(10),
    signupReviewMessage: z.string().trim().min(5).max(300),
    oneAccountWarningText: z.string().trim().min(5).max(300),
  }),
});