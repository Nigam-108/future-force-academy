import { PageShell } from "@/components/shared/page-shell";

export default function AdminLoginPage() {
  return (
    <PageShell title="Admin Login" description="Access the admin dashboard to manage tests, questions, students, and payments.">
      <div className="mx-auto max-w-md rounded-3xl border bg-white p-8 shadow-sm">
        <form className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input type="email" className="w-full rounded-xl border px-4 py-3" placeholder="Enter admin email" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <input type="password" className="w-full rounded-xl border px-4 py-3" placeholder="Enter password" />
          </div>

          <button className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            Login to Admin Panel
          </button>
        </form>
      </div>
    </PageShell>
  );
}