import { PageShell } from "@/components/shared/page-shell";

const notices = [
  {
    title: "WPSI Mock Test Series Batch 1 Open",
    category: "Announcement",
    date: "March 2026",
    description: "Enrollment has started for the next structured mock test series batch."
  },
  {
    title: "Live Test Window Updated",
    category: "Exam Update",
    date: "March 2026",
    description: "Some upcoming live tests now have revised time slots and result timings."
  },
  {
    title: "New Gujarati Language Support Added",
    category: "Platform Update",
    date: "March 2026",
    description: "Selected tests now support Gujarati alongside English and Hindi."
  }
];

export default function NoticesPage() {
  return (
    <PageShell
      title="Latest Notices & Updates"
      description="Stay informed with announcements, platform updates, and exam-related information."
    >
      <div className="space-y-4">
        {notices.map((notice) => (
          <div key={notice.title} className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {notice.category}
              </span>
              <span className="text-sm text-slate-500">{notice.date}</span>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-900">{notice.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{notice.description}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}