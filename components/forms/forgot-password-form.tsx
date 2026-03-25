"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { OtpInput } from "@/components/forms/otp-input";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
};

type ForgotPasswordStartData = {
  maskedEmail: string;
  otpLength: number;
  otpExpiresAt: string;
  resendAvailableAt: string;
};

type ForgotPasswordResetData = {
  redirectTo?: string;
  loginRedirectDelaySeconds?: number;
};

type ForgotPasswordFormProps = {
  initialEmail?: string;
  initialNotice?: string;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

function validatePassword(value: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);
}

function formatRemainingTime(target?: string | null) {
  if (!target) return null;

  const remaining = new Date(target).getTime() - Date.now();

  if (remaining <= 0) return "0s";

  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

async function parseApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  return (await response.json()) as ApiResponse<T>;
}

export function ForgotPasswordForm({
  initialEmail = "",
  initialNotice = "",
}: ForgotPasswordFormProps) {
  const router = useRouter();

  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState(initialEmail);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otpLength, setOtpLength] = useState(6);
  const [otpValue, setOtpValue] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [resendAvailableAt, setResendAvailableAt] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState(initialNotice);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const resendCountdown = useMemo(
    () => formatRemainingTime(resendAvailableAt),
    [resendAvailableAt]
  );

  const otpExpiryCountdown = useMemo(
    () => formatRemainingTime(otpExpiresAt),
    [otpExpiresAt]
  );

  const canResend = resendAvailableAt
    ? new Date(resendAvailableAt).getTime() <= Date.now()
    : false;

  const signupHref = useMemo(() => {
    const safeEmail = validateEmail(email) ? normalizeEmail(email) : "";
    return safeEmail
      ? `/signup?continueEmail=${encodeURIComponent(safeEmail)}&notice=${encodeURIComponent(
          "Complete your email verification first."
        )}`
      : "/signup";
  }, [email]);

  const showGoToSignup = errorMessage.toLowerCase().includes("complete email verification first");

  async function handleStart(event: FormEvent) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const normalizedEmail = normalizeEmail(email);

    if (!validateEmail(normalizedEmail)) {
      setErrorMessage("Enter a valid email address");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/auth/forgot-password/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      });

      const result = await parseApiResponse<ForgotPasswordStartData>(response);

      if (!response.ok || !result.success || !result.data) {
        setErrorMessage(result.message || "Failed to send reset OTP");
        return;
      }

      const startData = result.data;

      setMaskedEmail(startData.maskedEmail);
      setOtpLength(startData.otpLength);
      setOtpExpiresAt(startData.otpExpiresAt);
      setResendAvailableAt(startData.resendAvailableAt);
      setOtpValue("");
      setStep("reset");
      setSuccessMessage("Reset OTP sent successfully");
    } catch {
      setErrorMessage("Something went wrong while sending reset OTP.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendOtp() {
    const normalizedEmail = normalizeEmail(email);

    if (!validateEmail(normalizedEmail)) {
      setErrorMessage("Enter a valid email address");
      return;
    }

    try {
      setIsResending(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch("/api/auth/forgot-password/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      });

      const result = await parseApiResponse<ForgotPasswordStartData>(response);

      if (!response.ok || !result.success || !result.data) {
        setErrorMessage(result.message || "Failed to resend reset OTP");
        return;
      }

      const resendData = result.data;

      setMaskedEmail(resendData.maskedEmail);
      setOtpLength(resendData.otpLength);
      setOtpExpiresAt(resendData.otpExpiresAt);
      setResendAvailableAt(resendData.resendAvailableAt);
      setOtpValue("");
      setSuccessMessage("A fresh reset OTP has been sent to your email");
    } catch {
      setErrorMessage("Something went wrong while resending reset OTP.");
    } finally {
      setIsResending(false);
    }
  }

  async function handleReset(event: FormEvent) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const normalizedEmail = normalizeEmail(email);

    if (!validateEmail(normalizedEmail)) {
      setErrorMessage("Enter a valid email address");
      return;
    }

    if (otpValue.length !== otpLength) {
      setErrorMessage(`Enter the complete ${otpLength}-digit OTP`);
      return;
    }

    if (!validatePassword(newPassword)) {
      setErrorMessage(
        "Password must be at least 8 characters and include uppercase, lowercase, and a number"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          otp: otpValue,
          newPassword,
          confirmPassword,
        }),
      });

      const result = await parseApiResponse<ForgotPasswordResetData>(response);

      if (!response.ok || !result.success) {
        setErrorMessage(result.message || "Failed to reset password");
        return;
      }

      setSuccessMessage("Password reset successful. Redirecting to login...");
      setTimeout(() => {
        router.push(result.data?.redirectTo || "/login");
        router.refresh();
      }, (result.data?.loginRedirectDelaySeconds ?? 3) * 1000);
    } catch {
      setErrorMessage("Something went wrong while resetting password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {step === "request" ? (
        <>
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
              Forgot password
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Reset your password</h2>
            <p className="mt-2 text-sm text-slate-600">
              Enter your registered email address and we will send you a reset OTP.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleStart}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Registered Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your registered email"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
              />
            </div>

            {errorMessage ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <p>{errorMessage}</p>
                {showGoToSignup ? (
                  <div className="mt-3">
                    <Link
                      href={signupHref}
                      className="inline-flex rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                    >
                      Go to Signup
                    </Link>
                  </div>
                ) : null}
              </div>
            ) : null}

            {successMessage ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Sending Reset OTP..." : "Send Reset OTP"}
            </button>
          </form>
        </>
      ) : (
        <>
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
              Verify reset OTP
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Enter OTP and new password</h2>
            <p className="mt-2 text-sm text-slate-600">
              We sent a {otpLength}-digit reset OTP to <strong>{maskedEmail}</strong>.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleReset}>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <p>
                  <span className="font-medium text-slate-900">OTP expiry:</span>{" "}
                  {otpExpiryCountdown || "10m"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Resend cooldown:</span>{" "}
                  {resendCountdown || "Ready"}
                </p>
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-slate-700">OTP</label>
              <OtpInput
                value={otpValue}
                length={otpLength}
                onChange={setOtpValue}
                autoFocus
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Enter your new password"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm your new password"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
              />
            </div>

            {errorMessage ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            {successMessage ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Updating Password..." : "Update Password"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("request");
                  setOtpValue("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Change Email
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-medium text-slate-900">Didn’t receive the OTP?</p>
              <p className="mt-1 text-sm text-slate-600">
                You can request a fresh OTP after the cooldown. Older OTPs become invalid.
              </p>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResending || !canResend}
                className="mt-4 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isResending
                  ? "Resending..."
                  : canResend
                  ? "Resend OTP"
                  : `Resend in ${resendCountdown || "..."}`}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}