import Link from "next/link";
import { SignupForm } from "@/components/forms/signup-form";
import { PageShell } from "@/components/shared/page-shell";

export default function SignupPage() {
  return (
    <PageShell title="Create your account" description="Join Future Force Academy and start your exam practice.">
      <div className="mx-auto max-w-md space-y-4">
        <SignupForm />
        <p className="text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-blue-600">
            Login
          </Link>
        </p>
      </div>
    </PageShell>
  );
}