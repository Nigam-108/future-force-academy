export function UpcomingTestCard({
  title,
  exam,
  date,
  status
}: {
  title: string;
  exam: string;
  date: string;
  status: string;
}) {
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">{exam}</p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{status}</span>
      </div>
      <p className="mt-4 text-sm text-slate-600">{date}</p>
      <button className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
        Start When Live
      </button>
    </div>
  );
}