import { LanguageSwitcher } from "@/components/shared/language-switcher";

export function TestTimerBar() {
  return (
    <div className="sticky top-0 z-20 mb-6 rounded-3xl border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Current Section</p>
          <h2 className="text-lg font-semibold text-slate-900">Aptitude & Reasoning</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">Low Time Warning</div>
          <div className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">00:28:14</div>
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}