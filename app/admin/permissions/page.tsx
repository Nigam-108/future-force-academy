import { PageShell } from "@/components/shared/page-shell";

const permissions = [
  { role: "Sub Admin 1", keys: ["Question Bank", "Test Creation", "Result Viewing"] },
  { role: "Sub Admin 2", keys: ["Student Management", "Payment Viewing"] }
];

export default function PermissionsPage() {
  return (
    <PageShell title="Permissions" description="Control sub-admin access for different modules and management areas.">
      <div className="space-y-6">
        {permissions.map((item) => (
          <div key={item.role} className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{item.role}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "Question Bank",
                "Test Creation",
                "Student Management",
                "Result Viewing",
                "Payment Viewing",
                "Announcements"
              ].map((key) => {
                const enabled = item.keys.includes(key);
                return (
                  <label key={key} className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm text-slate-700">
                    <span>{key}</span>
                    <input type="checkbox" defaultChecked={enabled} />
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
