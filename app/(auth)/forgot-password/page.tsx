import { PageShell } from "@/components/shared/page-shell";

export default function ForgotPasswordPage() {
  return (
    <PageShell title="Forgot Password" description="Reset your password using your registered email and verification flow.">
      <div className="mx-auto max-w-md rounded-3xl border bg-white p-8 shadow-sm">
        <form className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Registered Email</label>
            <input className="w-full rounded-xl border px-4 py-3" placeholder="Enter your email" />
          </div>

          <button className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            Send Reset OTP / Link
          </button>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">New Password</label>
            <input type="password" className="w-full rounded-xl border px-4 py-3" placeholder="Enter new password" />
          </div>

          <button className="w-full rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Update Password
          </button>
        </form>
      </div>
    </PageShell>
  );
}