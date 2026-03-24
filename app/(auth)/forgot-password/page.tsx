import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
            Future Force Academy
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Forgot Password
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Reset your password securely using an email OTP.
          </p>
          <p className="mt-4 text-sm text-slate-600">
            Remembered your password?{" "}
            <Link href="/login" className="font-medium text-blue-600 underline">
              Back to Login
            </Link>
          </p>
        </div>

        <ForgotPasswordForm />
      </div>
    </div>
  );
}