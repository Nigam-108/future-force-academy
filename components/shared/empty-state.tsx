export function EmptyState({
  title,
  description,
  actionLabel
}: {
  title: string;
  description: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed bg-white p-10 text-center shadow-sm">
      <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-slate-100" />
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      {actionLabel ? (
        <button className="mt-5 rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
