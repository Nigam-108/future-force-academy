export function ErrorState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border bg-red-50 p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-red-100" />
      <h3 className="text-lg font-semibold text-red-700">{title}</h3>
      <p className="mt-2 text-sm text-red-600">{description}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">
          Retry
        </button>
        <button className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
          Back to Home
        </button>
      </div>
    </div>
  );
}
