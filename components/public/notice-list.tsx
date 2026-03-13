const notices = [
  { title: "New WPSI mock series launched", date: "March 2026" },
  { title: "Upcoming live test schedule updated", date: "March 2026" },
  { title: "Multi-language support added for selected tests", date: "March 2026" }
];

export function NoticeList() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Latest Notices & Updates</h2>
        <p className="mt-2 text-slate-600">
          Stay updated with latest announcements, exam updates, and launch notices.
        </p>
      </div>

      <div className="grid gap-4">
        {notices.map((notice) => (
          <div key={notice.title} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-semibold text-slate-900">{notice.title}</h3>
              <span className="text-sm text-slate-500">{notice.date}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}