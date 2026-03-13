import { PageShell } from "@/components/shared/page-shell";

const announcements = [
  { title: "WPSI Mock Test Series Open", status: "Active" },
  { title: "Live Test Rescheduled", status: "Active" },
  { title: "Platform Maintenance Notice", status: "Inactive" }
];

export default function AnnouncementsPage() {
  return (
    <PageShell title="Announcements" description="Create and manage text announcements visible across the website or dashboard.">
      <div className="mb-6 rounded-3xl border bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <input className="rounded-xl border px-4 py-3" placeholder="Write announcement title" />
          <button className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Create Announcement</button>
        </div>
        <textarea className="mt-4 min-h-28 w-full rounded-xl border px-4 py-3" placeholder="Write announcement content" />
      </div>

      <div className="space-y-4">
        {announcements.map((item) => (
          <div key={item.title} className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
                <p className="mt-1 text-sm text-slate-600">Status: {item.status}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Edit</button>
                <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Toggle Status</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
