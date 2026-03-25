"use client";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { OtpInput } from "@/components/forms/otp-input";
import { TurnstileWidget } from "@/components/forms/turnstile-widget";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
};

type SignupConfigData = {
  signupSettingsVersion: {
    id: string;
    versionNumber: number;
    title: string;
    summary?: string | null;
  };
  rules: {
    otpLength: number;
    otpExpiryMinutes: number;
    resendCooldownSeconds: number;
    resendLimit: number;
    resendWindowMinutes: number;
    resendBlockMinutes: number;
    wrongAttemptLimit: number;
    wrongAttemptBlockMinutes: number;
    pendingLifetimeHours: number;
    allowEmailOtpOnly: boolean;
    requireMobileNumber: boolean;
    loginIdentifierMode: string;
    marketingEmailsOptInDefault: boolean;
    turnstileSuspiciousAttemptThreshold: number;
    signupReviewMessage: string;
    oneAccountWarningText: string;
    
  };
  security: {
  turnstileEnabled: boolean;
  turnstileSiteKey: string;
  suspiciousWindowMinutes: number;
  suspiciousThresh01d: number;
  }
  policies: {
    terms: {
      versionId: string;
      versionNumber: number;
      title: string;
      summary?: string | null;
    };
    privacy: {
      versionId: string;
      versionNumber: number;
      title: string;
      summary?: string | null;
    };
    refund: {
      versionId: string;
      versionNumber: number;
      title: string;
      summary?: string | null;
    };
  };
};

type AvailabilityResult = {
  status: "NOT_CHECKED" | "INVALID_FORMAT" | "AVAILABLE" | "REGISTERED" | "PENDING";
  available: boolean;
  message: string;
  canContinueVerification?: boolean;
  maskedEmail?: string;
};

type SignupAvailabilityData = {
  email: AvailabilityResult;
  mobileNumber: AvailabilityResult;
};

type SignupOtpMeta = {
  pendingSignupId: string;
  maskedEmail: string;
  otpExpiresAt: string | null;
  resendAvailableAt: string | null;
  resendBlockedUntil?: string | null;
  pendingExpiresAt: string | null;
};

type SignupSecurityData = {
  turnstileEnabled: boolean;
  turnstileSiteKey: string;
  turnstileRequired: boolean;
  recentAttemptCount: number;
  suspiciousWindowMinutes: number;
  suspiciousThreshold: number;
};

type SignupVerifyData = {
  redirectTo?: string;
  loginRedirectDelaySeconds?: number;
};

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  password: string;
  confirmPassword: string;
  acceptPolicies: boolean;
  confirmSingleAccount: boolean;
  marketingEmailsEnabled: boolean;
};

type FieldErrors = Partial<Record<keyof FormValues | "otp" | "continueEmail", string>>;

const INITIAL_FORM: FormValues = {
  firstName: "",
  lastName: "",
  email: "",
  mobileNumber: "",
  password: "",
  confirmPassword: "",
  acceptPolicies: false,
  confirmSingleAccount: false,
  marketingEmailsEnabled: true,
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeMobileNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

function validateIndianMobile(value: string) {
  return /^[6-9]\d{9}$/.test(normalizeMobileNumber(value));
}

function validateName(value: string) {
  return /^[A-Za-z ]+$/.test(value.trim());
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
  const result = (await response.json()) as ApiResponse<T>;
  return result;
}

type SignupFormProps = {
  initialContinueEmail?: string;
  initialNotice?: string;
};

export function SignupForm({
  initialContinueEmail = "",
  initialNotice = "",
}: SignupFormProps) {

  const router = useRouter();

  const [config, setConfig] = useState<SignupConfigData | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [configError, setConfigError] = useState("");

  const [step, setStep] = useState<"details" | "otp">("details");
  const [form, setForm] = useState<FormValues>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formMessage, setFormMessage] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [availability, setAvailability] = useState<SignupAvailabilityData | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  const [continueEmail, setContinueEmail] = useState(initialContinueEmail);
const [continueMessage, setContinueMessage] = useState(initialNotice);

  const [continueError, setContinueError] = useState("");
  const [isContinuing, setIsContinuing] = useState(false);

  const [verificationEmail, setVerificationEmail] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [otpMeta, setOtpMeta] = useState<SignupOtpMeta | null>(null);
  const [otpError, setOtpError] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [turnstileRequired, setTurnstileRequired] = useState(false);
const [turnstileToken, setTurnstileToken] = useState("");
const [turnstileError, setTurnstileError] = useState("");
const [turnstileResetKey, setTurnstileResetKey] = useState(0);


  const normalizedEmail = useMemo(() => normalizeEmail(form.email), [form.email]);
  const normalizedMobileNumber = useMemo(
    () => normalizeMobileNumber(form.mobileNumber),
    [form.mobileNumber]
  );

  const resendCountdown = useMemo(
    () => formatRemainingTime(otpMeta?.resendAvailableAt),
    [otpMeta?.resendAvailableAt]
  );

  const otpExpiryCountdown = useMemo(
    () => formatRemainingTime(otpMeta?.otpExpiresAt),
    [otpMeta?.otpExpiresAt]
  );

  const blockedCountdown = useMemo(
    () => formatRemainingTime(otpMeta?.resendBlockedUntil),
    [otpMeta?.resendBlockedUntil]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadConfig() {
      try {
        setIsConfigLoading(true);
        setConfigError("");

        const response = await fetch("/api/auth/signup/config", {
          method: "GET",
          cache: "no-store",
        });

        const result = await parseApiResponse<SignupConfigData>(response);

if (!response.ok || !result.success || !result.data) {
  throw new Error(result.message || "Failed to load signup config");
}

const configData = result.data;

if (!isMounted) return;



setConfig(configData);
setForm((previous) => ({
  ...previous,
  marketingEmailsEnabled: configData.rules.marketingEmailsOptInDefault,
}));
      } catch (error) {
        if (!isMounted) return;
        setConfigError(error instanceof Error ? error.message : "Failed to load signup config");
      } finally {
        if (isMounted) {
          setIsConfigLoading(false);
        }
      }
    }

    loadConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (step !== "details") return;

    const shouldCheckEmail = normalizedEmail.length > 0 && validateEmail(normalizedEmail);
    const shouldCheckMobile =
      normalizedMobileNumber.length > 0 && validateIndianMobile(normalizedMobileNumber);

    if (!shouldCheckEmail && !shouldCheckMobile) {
      setAvailability(null);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setIsCheckingAvailability(true);

        const response = await fetch("/api/auth/signup/availability", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: shouldCheckEmail ? normalizedEmail : undefined,
            mobileNumber: shouldCheckMobile ? normalizedMobileNumber : undefined,
          }),
        });

        const result = await parseApiResponse<SignupAvailabilityData>(response);

if (!response.ok || !result.success || !result.data) {
  return;
}

const availabilityData = result.data;

setAvailability(availabilityData);

if (availabilityData.email.status === "PENDING") {
  setContinueEmail(normalizedEmail);
}
      } finally {
        setIsCheckingAvailability(false);
      }
    }, 450);

    return () => {
      window.clearTimeout(timer);
    };
  }, [normalizedEmail, normalizedMobileNumber, step]);

  useEffect(() => {
  const timer = window.setTimeout(() => {
    if (step === "details") {
      const email = validateEmail(normalizedEmail) ? normalizedEmail : undefined;
      const mobileNumber = validateIndianMobile(normalizedMobileNumber)
        ? normalizedMobileNumber
        : undefined;

      if (email || mobileNumber) {
        refreshSignupSecurityRequirement({ email, mobileNumber });
      }
    }

    if (step === "otp" && verificationEmail) {
      refreshSignupSecurityRequirement({ email: verificationEmail });
    }
  }, 500);

  return () => {
    window.clearTimeout(timer);
  };
}, [
  step,
  normalizedEmail,
  normalizedMobileNumber,
  verificationEmail,
  config?.security.turnstileEnabled
]);


  useEffect(() => {
    if (step !== "otp") return;

    const interval = window.setInterval(() => {
      // trigger rerender for countdown text
      setOtpMeta((previous) => (previous ? { ...previous } : previous));
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [step]);

  function updateField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setFieldErrors((previous) => ({ ...previous, [key]: undefined }));
    setFormMessage("");
    setFormSuccess("");
  }

  function validateForm(): FieldErrors {
    const errors: FieldErrors = {};

    if (!form.firstName.trim()) {
      errors.firstName = "First name is required";
    } else if (!validateName(form.firstName)) {
      errors.firstName = "First name can contain only letters and spaces";
    }

    if (form.lastName.trim() && !validateName(form.lastName)) {
      errors.lastName = "Last name can contain only letters and spaces";
    }

    if (!validateEmail(form.email)) {
      errors.email = "Enter a valid email address";
    }

    if (!validateIndianMobile(form.mobileNumber)) {
      errors.mobileNumber = "Enter a valid 10-digit Indian mobile number";
    }

    if (!validatePassword(form.password)) {
      errors.password =
        "Password must be at least 8 characters and include uppercase, lowercase, and a number";
    }

    if (form.confirmPassword !== form.password) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!form.acceptPolicies) {
      errors.acceptPolicies = "You must agree to the policies";
    }

    if (!form.confirmSingleAccount) {
      errors.confirmSingleAccount = "You must confirm the one-account rule";
    }

    return errors;
  }

  async function refreshSignupSecurityRequirement(input: {
  email?: string;
  mobileNumber?: string;
}) {
  if (!config?.security.turnstileEnabled) {
    setTurnstileRequired(false);
    return;
  }

  const response = await fetch("/api/auth/signup/security-requirement", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const result = await parseApiResponse<SignupSecurityData>(response);

  if (!response.ok || !result.success || !result.data) {
    return;
  }

  const securityData = result.data;

  setTurnstileRequired(securityData.turnstileRequired);

  if (!securityData.turnstileRequired) {
    setTurnstileToken("");
    setTurnstileError("");
  }
}


  async function handleStartSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFormMessage("");
    setFormSuccess("");
    setOtpError("");
    setOtpMessage("");

    const errors = validateForm();

    if (availability?.email.status === "REGISTERED") {
      errors.email = availability.email.message;
    }

    if (availability?.mobileNumber.status === "REGISTERED") {
      errors.mobileNumber = availability.mobileNumber.message;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (turnstileRequired && !turnstileToken) {
  setFormMessage("Complete the security check before sending OTP.");
  return;
}


    try {
      setIsSubmitting(true);

      const response = await fetch("/api/auth/signup/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: normalizedEmail,
          mobileNumber: normalizedMobileNumber,
          password: form.password,
          confirmPassword: form.confirmPassword,
          acceptPolicies: form.acceptPolicies,
          confirmSingleAccount: form.confirmSingleAccount,
          marketingEmailsEnabled: form.marketingEmailsEnabled,
            turnstileToken,
        }),
      });

const result = await parseApiResponse<SignupOtpMeta>(response);

if (!response.ok || !result.success || !result.data) {
  const message = result.message || "Failed to start signup";
  setFormMessage(message);

  if (message.toLowerCase().includes("continue verification")) {
    setContinueEmail(normalizedEmail);
  }

  if (
    message.toLowerCase().includes("security check required") ||
    message.toLowerCase().includes("security verification failed")
  ) {
    setTurnstileToken("");
    setTurnstileResetKey((value) => value + 1);
  }

  return;
}


const signupOtpData = result.data;

setVerificationEmail(normalizedEmail);
setOtpMeta(signupOtpData);
setStep("otp");
setOtpValue("");
setFormSuccess("Verification code sent successfully");
setFormMessage("");
setTurnstileToken("");
setTurnstileResetKey((value) => value + 1);

    } catch {
      setFormMessage("Something went wrong while starting signup.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleContinueVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setContinueError("");
    setContinueMessage("");
    setOtpError("");
    setOtpMessage("");

    const normalizedContinueEmail = normalizeEmail(continueEmail);

    if (!validateEmail(normalizedContinueEmail)) {
      setContinueError("Enter a valid email address");
      return;
    }

    try {
      setIsContinuing(true);

      const response = await fetch("/api/auth/signup/continue-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedContinueEmail,
        }),
      });

const result = await parseApiResponse<SignupOtpMeta>(response);

if (!response.ok || !result.success || !result.data) {
  setContinueError(result.message || "Failed to continue verification");
  return;
}

const continueOtpData = result.data;

setVerificationEmail(normalizedContinueEmail);
setOtpMeta(continueOtpData);
setOtpValue("");
setStep("otp");
setContinueMessage("Pending verification loaded successfully");
    } catch {
      setContinueError("Something went wrong while loading pending verification.");
    } finally {
      setIsContinuing(false);
    }
  }

  async function handleVerifyOtp(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    setOtpError("");
    setOtpMessage("");

    if (otpValue.length !== (config?.rules.otpLength ?? 4)) {
      setOtpError(`Enter the complete ${config?.rules.otpLength ?? 4}-digit OTP`);
      return;
    }

    try {
      setIsVerifyingOtp(true);

      const response = await fetch("/api/auth/signup/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: verificationEmail,
          otp: otpValue,
        }),
      });

      const result = await parseApiResponse<SignupVerifyData>(response);

      if (!response.ok || !result.success) {
        setOtpError(result.message || "OTP verification failed");
        return;
      }

      setOtpMessage("Email verified successfully. Redirecting...");
      router.push(result.data?.redirectTo || "/signup/success");
      router.refresh();
    } catch {
      setOtpError("Something went wrong while verifying OTP.");
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  async function handleResendOtp() {
    if (!verificationEmail) return;

    setOtpError("");
    setOtpMessage("");

if (turnstileRequired && !turnstileToken) {
  setOtpError("Complete the security check before resending OTP.");
  return;
}

    try {
      setIsResendingOtp(true);

      const response = await fetch("/api/auth/signup/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  email: verificationEmail,
  turnstileToken,
}),

      });

      const result = await parseApiResponse<SignupOtpMeta>(response);

if (!response.ok || !result.success || !result.data) {
  setOtpError(result.message || "Failed to resend OTP");
  return;
}

const resendOtpData = result.data;

setOtpMeta(resendOtpData);
setOtpValue("");
setOtpMessage("A fresh OTP has been sent to your email");
setTurnstileToken("");
setTurnstileResetKey((value) => value + 1);

    } catch {
      setOtpError("Something went wrong while resending OTP.");
    } finally {
      setIsResendingOtp(false);
    }
  }

  function handleEditDetails() {
    setStep("details");
    setOtpValue("");
    setOtpError("");
    setOtpMessage("");
  }

  const canResend =
    otpMeta?.resendAvailableAt ? new Date(otpMeta.resendAvailableAt).getTime() <= Date.now() : false;

  if (isConfigLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading signup form...</p>
      </div>
    );
  }

  if (!config || configError) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <p className="text-sm font-medium text-red-700">{configError || "Failed to load signup form"}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {step === "details" ? (
          <>
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                Student signup
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Create your account</h2>
              <p className="mt-2 text-sm text-slate-600">
                Enter your details, verify your email OTP, and create your student account.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleStartSignup}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">First Name</label>
                  <input
                    value={form.firstName}
                    onChange={(event) => updateField("firstName", event.target.value)}
                    placeholder="Enter your first name"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  />
                  {fieldErrors.firstName ? (
                    <p className="mt-2 text-xs text-red-600">{fieldErrors.firstName}</p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Last Name</label>
                  <input
                    value={form.lastName}
                    onChange={(event) => updateField("lastName", event.target.value)}
                    placeholder="Enter your last name (optional)"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  />
                  {fieldErrors.lastName ? (
                    <p className="mt-2 text-xs text-red-600">{fieldErrors.lastName}</p>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />
                {fieldErrors.email ? (
                  <p className="mt-2 text-xs text-red-600">{fieldErrors.email}</p>
                ) : availability?.email?.message ? (
                  <p
                    className={`mt-2 text-xs ${
                      availability.email.status === "AVAILABLE"
                        ? "text-emerald-600"
                        : availability.email.status === "PENDING"
                        ? "text-amber-600"
                        : "text-slate-500"
                    }`}
                  >
                    {availability.email.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Mobile Number</label>
                <input
                  type="tel"
                  value={form.mobileNumber}
                  onChange={(event) =>
                    updateField("mobileNumber", normalizeMobileNumber(event.target.value))
                  }
                  placeholder="Enter your 10-digit mobile number"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />
                {fieldErrors.mobileNumber ? (
                  <p className="mt-2 text-xs text-red-600">{fieldErrors.mobileNumber}</p>
                ) : availability?.mobileNumber?.message ? (
                  <p
                    className={`mt-2 text-xs ${
                      availability.mobileNumber.status === "AVAILABLE"
                        ? "text-emerald-600"
                        : availability.mobileNumber.status === "PENDING"
                        ? "text-amber-600"
                        : "text-slate-500"
                    }`}
                  >
                    {availability.mobileNumber.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  />
                  {fieldErrors.password ? (
                    <p className="mt-2 text-xs text-red-600">{fieldErrors.password}</p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">
                      Minimum 8 characters, 1 uppercase, 1 lowercase, and 1 number
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(event) => updateField("confirmPassword", event.target.value)}
                    placeholder="Confirm your password"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                  />
                  {fieldErrors.confirmPassword ? (
                    <p className="mt-2 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
  <p className="text-sm font-medium text-amber-900">Before we send OTP</p>
  <p className="mt-1 text-sm text-amber-800">
    {config.rules.signupReviewMessage}
  </p>
  <p className="mt-2 text-sm font-medium text-amber-900">
    {config.rules.oneAccountWarningText}
  </p>
</div>



              <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.acceptPolicies}
                    onChange={(event) => updateField("acceptPolicies", event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                  />
                  <span>
                    I agree to the{" "}
                    <Link href="/terms" target="_blank" className="font-medium text-blue-600 underline">
                      Terms & Conditions
                    </Link>
                    ,{" "}
                    <Link
                      href="/privacy-policy"
                      target="_blank"
                      className="font-medium text-blue-600 underline"
                    >
                      Privacy Policy
                    </Link>
                    , and{" "}
                    <Link
                      href="/refund-cancellation-policy"
                      target="_blank"
                      className="font-medium text-blue-600 underline"
                    >
                      Refund / Cancellation Policy
                    </Link>
                    .
                  </span>
                </label>
                {fieldErrors.acceptPolicies ? (
                  <p className="text-xs text-red-600">{fieldErrors.acceptPolicies}</p>
                ) : null}

                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.confirmSingleAccount}
                    onChange={(event) =>
                      updateField("confirmSingleAccount", event.target.checked)
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                  />
                  <span>I confirm that only one account is allowed per email and mobile number.</span>
                </label>
                {fieldErrors.confirmSingleAccount ? (
                  <p className="text-xs text-red-600">{fieldErrors.confirmSingleAccount}</p>
                ) : null}

                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.marketingEmailsEnabled}
                    onChange={(event) =>
                      updateField("marketingEmailsEnabled", event.target.checked)
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                  />
                  <span>Send me future updates on email</span>
                </label>
              </div>

              {formMessage ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formMessage}
                </div>
              ) : null}

              {formSuccess ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {formSuccess}
                </div>
              ) : null}

              {config.security.turnstileEnabled && turnstileRequired ? (
  <TurnstileWidget
    siteKey={config.security.turnstileSiteKey}
    visible
    resetKey={turnstileResetKey}
    onTokenChange={(token) => {
      setTurnstileToken(token);
      setTurnstileError("");
    }}
    onError={(message) => {
      setTurnstileError(message);
    }}
  />
) : null}

{turnstileError ? (
  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
    {turnstileError}
  </div>
) : null}


              <button
                type="submit"
                disabled={isSubmitting || isCheckingAvailability}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Sending OTP..." : "Send OTP"}
              </button>

              {isCheckingAvailability ? (
                <p className="text-xs text-slate-500">Checking email/mobile availability...</p>
              ) : null}
            </form>
          </>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                Verify email
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Enter your OTP</h2>
              <p className="mt-2 text-sm text-slate-600">
                We sent a {config.rules.otpLength}-digit OTP to <strong>{otpMeta?.maskedEmail}</strong>.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleVerifyOtp}>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                  <p>
                    <span className="font-medium text-slate-900">OTP expiry:</span>{" "}
                    {otpExpiryCountdown || `${config.rules.otpExpiryMinutes}m`}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Pending signup expires:</span>{" "}
                    {otpMeta?.pendingExpiresAt ? formatRemainingTime(otpMeta.pendingExpiresAt) : "—"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Resend cooldown:</span>{" "}
                    {resendCountdown || "Ready"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Wrong OTP block rule:</span>{" "}
                    {config.rules.wrongAttemptLimit} attempts / {config.rules.wrongAttemptBlockMinutes}m block
                  </p>
                </div>
                {blockedCountdown ? (
                  <p className="mt-3 text-sm font-medium text-amber-700">
                    Resend block active for: {blockedCountdown}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-slate-700">OTP</label>
                <OtpInput
                  value={otpValue}
                  length={config.rules.otpLength}
                  onChange={setOtpValue}
                  autoFocus
                  disabled={isVerifyingOtp}
                />
                <p className="mt-3 text-xs text-slate-500">
                  Tip: if you paste the full OTP into the first box, all boxes will auto-fill.
                </p>
              </div>

              {otpError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {otpError}
                </div>
              ) : null}

              {otpMessage ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {otpMessage}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isVerifyingOtp ? "Verifying..." : "Verify & Create Account"}
                </button>

                <button
                  type="button"
                  onClick={handleEditDetails}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Edit details
                </button>
              </div>
                {config.security.turnstileEnabled && turnstileRequired ? (
  <TurnstileWidget
    siteKey={config.security.turnstileSiteKey}
    visible
    resetKey={turnstileResetKey}
    onTokenChange={(token) => {
      setTurnstileToken(token);
      setTurnstileError("");
      setOtpError("");
    }}
    onError={(message) => {
      setTurnstileError(message);
    }}
  />
) : null}

{turnstileError ? (
  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
    {turnstileError}
  </div>
) : null}

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-medium text-slate-900">Didn’t receive the OTP?</p>
                <p className="mt-1 text-sm text-slate-600">
                  You can resend a fresh OTP after the cooldown. Old OTP becomes invalid immediately.
                </p>

                <button
                  type="button"
                  disabled={isResendingOtp || !canResend}
                  onClick={handleResendOtp}
                  className="mt-4 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isResendingOtp
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

      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
            Continue verification
          </p>
          <h3 className="mt-2 text-lg font-bold text-slate-900">Already received an OTP?</h3>
          <p className="mt-2 text-sm text-slate-600">
            Enter your email to continue your pending verification without filling the full form again.
          </p>

          <form className="mt-5 space-y-4" onSubmit={handleContinueVerification}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={continueEmail}
                onChange={(event) => {
                  setContinueEmail(event.target.value);
                  setContinueError("");
                  setContinueMessage("");
                }}
                placeholder="Enter your email"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
              />
              {continueError ? (
                <p className="mt-2 text-xs text-red-600">{continueError}</p>
              ) : null}
              {continueMessage ? (
                <p className="mt-2 text-xs text-emerald-600">{continueMessage}</p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={isContinuing}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isContinuing ? "Loading..." : "Continue Verification"}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
            Important notes
          </p>
          <ul className="mt-3 space-y-3 text-sm text-slate-600">
            <li>• Account is created only after correct email OTP verification.</li>
            <li>• Mobile number must be a valid Indian 10-digit number.</li>
            <li>• Only one account is allowed per email and mobile number.</li>
            <li>• Important system emails can still be sent even if future updates are turned off.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}