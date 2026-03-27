type SaveStatus = "idle" | "saving" | "saved" | "error";

type TestTimerBarProps = {
  overallSecondsLeft: number | null;
  isOverallLowTime: boolean;
  currentSectionTitle?: string | null;
  currentSectionSecondsLeft?: number | null;
  isCurrentSectionLowTime?: boolean;
  showCurrentSectionTimer?: boolean;
  saveStatus: SaveStatus;
  formatTimer: (totalSeconds: number | null) => string;
};

export function TestTimerBar({
  overallSecondsLeft,
  isOverallLowTime,
  currentSectionTitle,
  currentSectionSecondsLeft,
  isCurrentSectionLowTime = false,
  showCurrentSectionTimer = false,
  saveStatus,
  formatTimer,
}: TestTimerBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
        <p className="text-xs uppercase tracking-wide text-slate-500">Time Left</p>
        <p
          className={`mt-1 text-xl font-semibold ${
            isOverallLowTime ? "text-red-600" : "text-slate-900"
          }`}
        >
          {formatTimer(overallSecondsLeft)}
        </p>
      </div>

      {showCurrentSectionTimer ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Current Section
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {currentSectionTitle ?? "—"}
          </p>
          <p
            className={`mt-1 text-lg font-semibold ${
              isCurrentSectionLowTime ? "text-red-600" : "text-slate-900"
            }`}
          >
            {formatTimer(currentSectionSecondsLeft ?? null)}
          </p>
        </div>
      ) : null}

      <div
        className={`rounded-2xl border px-4 py-3 text-center text-sm font-medium ${
          saveStatus === "saving"
            ? "border-blue-200 bg-blue-50 text-blue-700"
            : saveStatus === "saved"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : saveStatus === "error"
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : "border-slate-200 bg-slate-50 text-slate-600"
        }`}
      >
        {saveStatus === "saving"
          ? "Saving..."
          : saveStatus === "saved"
          ? "Saved"
          : saveStatus === "error"
          ? "Save Failed"
          : "Ready"}
      </div>
    </div>
  );
}