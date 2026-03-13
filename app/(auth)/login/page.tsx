import Link from "next/link";
import { LoginForm } from "@/components/forms/login-form";
import { PageShell } from "@/components/shared/page-shell";

export default function LoginPage() {
  return (
    <PageShell title="Login" description="Access your dashboard, tests, results, and purchases.">
      <div className="mx-auto max-w-md space-y-4">
        <LoginForm />
        <div className="flex items-center justify-between text-sm text-slate-600">
          <Link href="/forgot-password">Forgot password?</Link>
          <Link href="/otp-login">Login with OTP</Link>
        </div>
        <p className="text-center text-sm text-slate-600">
          Don’t have an account?{" "}
          <Link href="/signup" className="font-semibold text-blue-600">
            Create one
          </Link>
        </p>
      </div>
    </PageShell>
  );
}