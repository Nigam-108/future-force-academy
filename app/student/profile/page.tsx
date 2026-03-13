import { PageShell } from "@/components/shared/page-shell";

export default function StudentProfilePage() {
  return (
    <PageShell title="Profile & Settings" description="Manage your personal information, preferences, and account settings.">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Profile Summary</h2>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <p><span className="font-semibold text-slate-900">Name:</span> Nigam Student</p>
            <p><span className="font-semibold text-slate-900">Email:</span> nigam@example.com</p>
            <p><span className="font-semibold text-slate-900">Mobile:</span> +91 99999 99999</p>
          </div>
        </div>

        <form className="space-y-4 rounded-3xl border bg-white p-8 shadow-sm">
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Full name" defaultValue="Nigam Student" />
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Mobile number" defaultValue="+91 99999 99999" />
          <select className="w-full rounded-xl border px-4 py-3">
            <option>Preferred language: English</option>
            <option>Gujarati</option>
            <option>Hindi</option>
          </select>
          <select className="w-full rounded-xl border px-4 py-3">
            <option>Preferred exam/course</option>
            <option>Wireless PSI & Technical Operator</option>
            <option>UPSC</option>
            <option>GPSC</option>
          </select>
          <input type="password" className="w-full rounded-xl border px-4 py-3" placeholder="Change password" />
          <button className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            Save Changes
          </button>
        </form>
      </div>
    </PageShell>
  );
}