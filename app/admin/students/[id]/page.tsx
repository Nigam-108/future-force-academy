import { PageShell } from "@/components/shared/page-shell";

export default function SingleStudentPage() {
  return (
    <PageShell title="Student Details" description="View profile, purchased tests, attempts, and admin controls for a student.">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Profile Summary</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p><span className="font-semibold text-slate-900">Name:</span> Nigam Student</p>
              <p><span className="font-semibold text-slate-900">Email:</span> nigam@example.com</p>
              <p><span className="font-semibold text-slate-900">Course:</span> Wireless PSI & Technical Operator</p>
              <p><span className="font-semibold text-slate-900">Status:</span> Active</p>
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Admin Actions</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">Assign Test</button>
              <button className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">Reset Password</button>
              <button className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">Override Access</button>
              <button className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700">Block Student</button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Purchased Series</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl border p-4">WPSI Full Mock Test Series — Active</div>
              <div className="rounded-2xl border p-4">Aptitude Booster Pack — Active</div>
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Attempts & Results</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl border p-4">WPSI Mock Test 01 — Score 78</div>
              <div className="rounded-2xl border p-4">WPSI Mock Test 02 — Score 81</div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
