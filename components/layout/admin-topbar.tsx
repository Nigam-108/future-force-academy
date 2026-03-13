export function AdminTopbar() {
  return (
    <div className="border-b bg-white px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-500">Manage tests, question bank, students, payments, and reports.</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">Main Admin</span>
        </div>
      </div>
    </div>
  );
}