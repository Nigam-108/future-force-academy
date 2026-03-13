import { PageShell } from "@/components/shared/page-shell";

const logs = [
  { action: "Created test", actor: "Main Admin", time: "11 Mar 2026 · 10:45 AM", entity: "WPSI Full Mock Test 01" },
  { action: "Edited question", actor: "Sub Admin 1", time: "11 Mar 2026 · 09:10 AM", entity: "Q-102" },
  { action: "Changed payment status", actor: "Main Admin", time: "10 Mar 2026 · 07:35 PM", entity: "P-301" },
  { action: "Blocked student", actor: "Main Admin", time: "10 Mar 2026 · 05:20 PM", entity: "S-1003" }
];

export default function ActivityLogsPage() {
  return (
    <PageShell title="Activity Logs" description="Review major admin actions such as test edits, question changes, payments, and student controls.">
      <div className="space-y-4">
        {logs.map((log, index) => (
          <div key={`${log.action}-${index}`} className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold text-slate-900">{log.action}</h2>
              <p className="text-sm text-slate-600">Actor: {log.actor}</p>
              <p className="text-sm text-slate-600">Entity: {log.entity}</p>
              <p className="text-sm text-slate-500">{log.time}</p>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
