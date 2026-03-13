import { PageShell } from "@/components/shared/page-shell";

const requests = [
  { name: "Nigam Student", subject: "Unable to access purchased series", status: "Open" },
  { name: "Aarav Patel", subject: "Result not visible", status: "In Progress" },
  { name: "Riya Shah", subject: "Need payment confirmation", status: "Resolved" }
];

export default function SupportPage() {
  return (
    <PageShell title="Support Requests" description="Review enquiry forms, issue reports, and student help requests.">
      <div className="space-y-4">
        {requests.map((request) => (
          <div key={`${request.name}-${request.subject}`} className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{request.subject}</h2>
                <p className="mt-1 text-sm text-slate-600">From: {request.name}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{request.status}</span>
                <button className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Open</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
