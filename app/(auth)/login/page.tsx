import Link from "next/link";
import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
            Future Force Academy
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Login
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Access your student or admin account using email or mobile number.
          </p>
          <p className="mt-4 text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-blue-600 underline">
              Sign up
            </Link>
          </p>
          <p className="mt-2 text-sm text-slate-600">
            <Link href="/forgot-password" className="font-medium text-blue-600 underline">
              Forgot password?
            </Link>
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}