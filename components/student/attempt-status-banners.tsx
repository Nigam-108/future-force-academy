type AttemptStatusBannersProps = {
  hasMalformedAssignments: boolean;
  hasEmptyCurrentSection: boolean;
  currentSectionTitle: string | null;
};

export function AttemptStatusBanners({
  hasMalformedAssignments,
  hasEmptyCurrentSection,
  currentSectionTitle,
}: AttemptStatusBannersProps) {
  return (
    <>
      {hasMalformedAssignments ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Some question-to-section assignments look inconsistent. Section ranges or highlighting may be incomplete until the test assignments are corrected.
        </div>
      ) : null}

      {hasEmptyCurrentSection ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {currentSectionTitle
            ? `Section "${currentSectionTitle}" currently has no assigned questions.`
            : "The current section has no assigned questions."}
        </div>
      ) : null}
    </>
  );
}