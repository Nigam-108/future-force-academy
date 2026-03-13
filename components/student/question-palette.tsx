const palette = [
  { number: 1, state: "current" },
  { number: 2, state: "attempted" },
  { number: 3, state: "review" },
  { number: 4, state: "default" },
  { number: 5, state: "attempted" },
  { number: 6, state: "default" },
  { number: 7, state: "default" },
  { number: 8, state: "review" },
  { number: 9, state: "attempted" },
  { number: 10, state: "default" }
];

function paletteClass(state: string) {
  if (state === "current") return "bg-blue-600 text-white border-blue-600";
  if (state === "attempted") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (state === "review") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-white text-slate-700 border-slate-200";
}

export function QuestionPalette() {
  return (
    <div className="rounded-3xl border bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Questions</h3>
      <p className="mt-1 text-sm text-slate-500">Attempted, review, and current question indicators.</p>
      <div className="mt-5 grid grid-cols-5 gap-3">
        {palette.map((item) => (
          <button
            key={item.number}
            className={`rounded-xl border px-3 py-3 text-sm font-semibold ${paletteClass(item.state)}`}
          >
            {item.number}
          </button>
        ))}
      </div>
      <div className="mt-6 space-y-2 text-xs text-slate-600">
        <p>• Blue = Current question</p>
        <p>• Green = Attempted</p>
        <p>• Yellow = Marked for review</p>
      </div>
    </div>
  );
}