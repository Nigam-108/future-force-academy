import { z } from "zod";

// ─── Zod v4 env validation schema ─────────────────────────────────────────────
// Validates ALL environment variables at server startup
// App throws a clear, readable error if anything is missing or wrong
// Much better than silent "undefined" bugs in production
//
// Usage anywhere in server code:
//   import { env } from "@/server/config/env"
//   const secret = env.JWT_SECRET  ← fully typed + validated
const envSchema = z.object({

  // ── Node environment ──────────────────────────────────────────────────────
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // ── Database ──────────────────────────────────────────────────────────────
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required — add it to .env.local"),

  // ── JWT Auth ──────────────────────────────────────────────────────────────
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters long"),

  JWT_EXPIRES_IN: z
    .string()
    .default("7d"),

  // ── Cookie ────────────────────────────────────────────────────────────────
  COOKIE_NAME: z
    .string()
    .default("ffa_session"),

  // ── App URL ───────────────────────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL like http://localhost:3000")
    .default("http://localhost:3000"),

  // ── Razorpay ──────────────────────────────────────────────────────────────
  RAZORPAY_KEY_ID: z
    .string()
    .min(1, "RAZORPAY_KEY_ID is required"),

  RAZORPAY_KEY_SECRET: z
    .string()
    .min(1, "RAZORPAY_KEY_SECRET is required"),

  RAZORPAY_WEBHOOK_SECRET: z
    .string()
    .min(1, "RAZORPAY_WEBHOOK_SECRET is required"),

  NEXT_PUBLIC_RAZORPAY_KEY_ID: z
    .string()
    .min(1, "NEXT_PUBLIC_RAZORPAY_KEY_ID is required"),

  // ── Email (added in 6F batch) ─────────────────────────────────────────────
  EMAIL_PROVIDER: z
    .enum(["console", "resend"])
    .default("console"),

  EMAIL_FROM: z
    .string()
    .default("Future Force Academy <noreply@example.com>"),

  EMAIL_REPLY_TO: z
    .string()
    .optional(),

  // Resend API key — optional in dev, required in production when using resend
  RESEND_API_KEY: z
    .string()
    .optional(),

  // ── Cron (added in 8C batch) ──────────────────────────────────────────────
  // Optional — if not set, cron endpoint warns but still works in dev
  CRON_SECRET: z
    .string()
    .optional(),

  // ── Turnstile / Cloudflare (optional) ────────────────────────────────────
  TURNSTILE_SECRET_KEY: z
    .string()
    .optional(),

  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z
    .string()
    .optional(),
});

// ─── Validate at module load time ─────────────────────────────────────────────
// Runs ONCE when server starts — fails fast with readable error
// Example error output:
//   🚨 Invalid environment variables:
//     ❌ DATABASE_URL: DATABASE_URL is required — add it to .env.local
//     ❌ JWT_SECRET: JWT_SECRET must be at least 32 characters long
function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    // Zod v4 uses result.error.issues (not .flatten())
    const errors = result.error.issues
      .map((issue) => `  ❌ ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `\n\n🚨 Invalid environment variables:\n${errors}\n\nFix these in your .env.local file.\n`
    );
  }

  return result.data;
}

// Export validated + typed env object
// Use this everywhere instead of process.env directly
export const env = validateEnv();
export type Env = z.infer<typeof envSchema>;