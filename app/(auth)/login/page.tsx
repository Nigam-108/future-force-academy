import Link from "next/link";
import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-3xl border bg-white p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-700">
            Future Force Academy
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Login</h1>
          <p className="mt-2 text-sm text-slate-600">
            Access your student or admin account.
          </p>
        </div>

        <LoginForm />

        <div className="mt-6 text-center text-sm text-slate-600">
          <p>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-blue-700 hover:underline">
              Sign up
            </Link>
          </p>

          <p className="mt-2">
            <Link
              href="/forgot-password"
              className="font-semibold text-slate-700 hover:underline"
            >
              Forgot password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}