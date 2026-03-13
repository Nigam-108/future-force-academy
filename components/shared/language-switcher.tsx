export function LanguageSwitcher() {
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-medium text-slate-700">
      <button className="rounded-lg bg-blue-600 px-2.5 py-1 text-white">EN</button>
      <button className="rounded-lg px-2.5 py-1 hover:bg-slate-100">GU</button>
      <button className="rounded-lg px-2.5 py-1 hover:bg-slate-100">HI</button>
    </div>
  );
}