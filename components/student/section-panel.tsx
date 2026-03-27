type SectionPanelItem = {
  id: string;
  title: string;
  durationInMinutes: number | null;
  questionIndexes: number[];
  startQuestionNumber: number | null;
  endQuestionNumber: number | null;
};

type SectionPanelProps = {
  sections: SectionPanelItem[];
  effectiveSectionIndex: number | null;
  allowFreeSectionSwitching: boolean;
  isSectionWiseTiming: boolean;
  currentSectionSecondsLeft: number | null;
  isCurrentSectionLowTime: boolean;
  onOpenSection: (questionIndex: number) => void;
  formatTimer: (totalSeconds: number | null) => string;
};

export function SectionPanel({
  sections,
  effectiveSectionIndex,
  allowFreeSectionSwitching,
  isSectionWiseTiming,
  currentSectionSecondsLeft,
  isCurrentSectionLowTime,
  onOpenSection,
  formatTimer,
}: SectionPanelProps) {
  if (sections.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Sections</h3>

      <div className="mt-4 space-y-3">
        {sections.map((section, index) => {
          const isCurrent = effectiveSectionIndex === index;

          const isLocked =
            !allowFreeSectionSwitching &&
            effectiveSectionIndex !== null &&
            index < effectiveSectionIndex;

          const isFuture =
            !allowFreeSectionSwitching &&
            effectiveSectionIndex !== null &&
            index > effectiveSectionIndex;

          const sectionTimerLabel = isSectionWiseTiming
            ? isCurrent
              ? formatTimer(currentSectionSecondsLeft)
              : isLocked
              ? "Locked"
              : section.durationInMinutes
              ? `${section.durationInMinutes} min • Not Started`
              : "Not Started"
            : section.durationInMinutes
            ? `${section.durationInMinutes} min`
            : "Overall timer";

          const sectionTimerClass =
            isSectionWiseTiming && isCurrent && isCurrentSectionLowTime
              ? "text-red-600"
              : "text-slate-700";

          return (
            <div
              key={section.id}
              className={`rounded-2xl border p-4 ${
                isCurrent
                  ? "border-blue-200 bg-blue-50"
                  : isLocked
                  ? "border-slate-200 bg-slate-100 text-slate-500"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  {allowFreeSectionSwitching && section.questionIndexes[0] !== undefined ? (
                    <button
                      type="button"
                      onClick={() => onOpenSection(section.questionIndexes[0])}
                      className="font-medium text-slate-900 hover:text-blue-700 hover:underline"
                    >
                      {section.title}
                    </button>
                  ) : (
                    <p className="font-medium text-slate-900">{section.title}</p>
                  )}

                  <p className="mt-1 text-xs text-slate-600">
                    {section.startQuestionNumber && section.endQuestionNumber
                      ? `Q${section.startQuestionNumber}-Q${section.endQuestionNumber}`
                      : "No assigned questions"}
                  </p>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    isCurrent
                      ? "bg-blue-100 text-blue-700"
                      : isLocked
                      ? "bg-slate-200 text-slate-600"
                      : isFuture
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {isCurrent
  ? "Current"
  : isLocked
  ? "Locked"
  : isFuture
  ? "Upcoming"
  : section.questionIndexes.length === 0
  ? "Empty"
  : "Open"}
                </span>
              </div>

              <p className={`mt-2 text-sm ${sectionTimerClass}`}>{sectionTimerLabel}</p>
              {section.questionIndexes.length === 0 ? (
  <p className="mt-2 text-xs text-slate-500">
    No assigned questions in this section yet.
  </p>
) : null}

              {allowFreeSectionSwitching && section.questionIndexes[0] !== undefined ? (
                <button
                  type="button"
                  onClick={() => onOpenSection(section.questionIndexes[0])}
                  className="mt-3 rounded-xl border px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white"
                >
                  Go to Section
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}