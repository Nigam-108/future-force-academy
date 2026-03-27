type PaletteState = "current" | "attempted" | "review" | "default";

type QuestionPaletteItem = {
  key: string;
  number: number;
  state: PaletteState;
  disabled?: boolean;
};

type QuestionPaletteProps = {
  items: QuestionPaletteItem[];
  onQuestionClick: (index: number) => void;
};

function paletteClass(state: PaletteState) {
  if (state === "current") return "bg-blue-600 text-white border-blue-600";
  if (state === "attempted") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (state === "review") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-white text-slate-700 border-slate-200";
}

export function QuestionPalette({
  items,
  onQuestionClick,
}: QuestionPaletteProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Question Palette</h3>
      <p className="mt-1 text-xs text-slate-500">
        Blue = Current, Green = Answered, Yellow = Review.
      </p>

      <div className="mt-4 grid grid-cols-5 gap-2">
        {items.map((item, index) => (
          <button
            key={item.key}
            type="button"
            disabled={item.disabled}
            onClick={() => onQuestionClick(index)}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold ${paletteClass(
              item.state
            )} ${item.disabled ? "cursor-not-allowed opacity-50" : ""}`}
          >
            {item.number}
          </button>
        ))}
      </div>
    </section>
  );
}