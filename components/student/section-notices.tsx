type SectionNoticesProps = {
  sectionNotice: string | null;
  showSectionEndingWarning: boolean;
  currentSectionTitle: string | null;
  currentSectionSecondsLeft: number | null;
  formatTimer: (totalSeconds: number | null) => string;
};

export function SectionNotices({
  sectionNotice,
  showSectionEndingWarning,
  currentSectionTitle,
  currentSectionSecondsLeft,
  formatTimer,
}: SectionNoticesProps) {
  return (
    <>
      {sectionNotice ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {sectionNotice}
        </div>
      ) : null}

      {showSectionEndingWarning ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Warning: Section "{currentSectionTitle}" will auto-switch in{" "}
          <span className="font-semibold">{formatTimer(currentSectionSecondsLeft)}</span>.
          Save/review your answer now.
        </div>
      ) : null}
    </>
  );
}