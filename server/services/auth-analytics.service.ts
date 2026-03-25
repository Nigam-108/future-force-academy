import { AuthEventType } from "@prisma/client";
import {
  createAuthEvent,
  getAuthInsights,
  type CreateAuthEventInput,
} from "@/server/repositories/auth-analytics.repository";

export async function logAuthEvent(input: CreateAuthEventInput) {
  try {
    await createAuthEvent(input);
  } catch (error) {
    console.error("[AuthAnalytics] Failed to write auth event:", error);
  }
}

export async function getAdminAuthInsights(days: number) {
  return getAuthInsights(days);
}

export const AUTH_EVENTS = {
  SIGNUP_STARTED: "SIGNUP_STARTED",
  OTP_SENT: "OTP_SENT",
  OTP_RESENT: "OTP_RESENT",
  OTP_VERIFIED: "OTP_VERIFIED",
  SIGNUP_COMPLETED: "SIGNUP_COMPLETED",
  SIGNUP_FAILED: "SIGNUP_FAILED",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILED: "LOGIN_FAILED",
  FORGOT_PASSWORD_REQUESTED: "FORGOT_PASSWORD_REQUESTED",
  POLICY_ACKNOWLEDGED: "POLICY_ACKNOWLEDGED",
} as const satisfies Record<string, AuthEventType>;