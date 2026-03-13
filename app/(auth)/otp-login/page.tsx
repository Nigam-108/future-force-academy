import { PageShell } from "@/components/shared/page-shell";

export default function OtpLoginPage() {
  return (
    <PageShell title="OTP Login" description="Enter your email and verify using OTP to access your account.">
      <div className="mx-auto max-w-md rounded-3xl border bg-white p-8 shadow-sm">
        <form className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input className="w-full rounded-xl border px-4 py-3" placeholder="Enter your email" />
          </div>

          <button className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            Send OTP
          </button>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">OTP</label>
            <input className="w-full rounded-xl border px-4 py-3" placeholder="Enter OTP" />
          </div>

          <button className="w-full rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Verify & Login
          </button>
        </form>
      </div>
    </PageShell>
  );
}