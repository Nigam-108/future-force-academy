"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type LoginResponse = {
  success: boolean;
  message: string;
  data?: {
    id: string;
    fullName: string;
    email: string;
    role: "STUDENT" | "ADMIN" | "SUB_ADMIN";
    preferredLanguage: string;
    emailVerified: boolean;
  };
  errors?: unknown;
};

export function LoginForm() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showGoToSignup = useMemo(() => {
    return errorMessage.toLowerCase().includes("complete email verification first");
  }, [errorMessage]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier,
          password,
        }),
      });

      const result: LoginResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        setErrorMessage(result.message || "Login failed");
        return;
      }

      setSuccessMessage("Login successful");

      if (result.data.role === "ADMIN" || result.data.role === "SUB_ADMIN") {
        router.push("/admin/dashboard");
        router.refresh();
        return;
      }

      router.push("/student/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("Something went wrong while logging in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Email or Mobile Number
        </label>
        <input
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="Enter your email or 10-digit mobile number"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
          required
        />
        <p className="mt-2 text-xs text-slate-500">
          You can login using your email or Indian 10-digit mobile number.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
          required
        />
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{errorMessage}</p>

          {showGoToSignup ? (
            <div className="mt-3">
              <Link
                href="/signup"
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
        {isSubmitting ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}