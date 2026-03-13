const actions = [
  "Create Test",
  "Add Question",
  "Import Questions",
  "View Payments",
  "Manage Students",
  "Announcements"
];

export function AdminQuickActions() {
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => (
          <button key={action} className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}