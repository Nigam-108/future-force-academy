import Link from "next/link";

/**
 * Reusable UI block for:
 * - empty states
 * - error states
 * - info states
 *
 * Why this exists:
 * - keeps page state handling visually consistent
 * - reduces duplicate markup across admin/student pages
 * - supports optional action buttons
 */
type StateCardProps = {
  title: string;
  description: string;
  tone?: "default" | "error" | "warning" | "success";
  primaryActionLabel?: string;
  primaryActionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
};

function toneClass(tone: StateCardProps["tone"]) {
  switch (tone) {
    case "error":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "default":
    default:
      return "border-slate-200 bg-white text-slate-700";
  }
}

export function StateCard({
  title,
  description,
  tone = "default",
  primaryActionLabel,
  primaryActionHref,
  secondaryActionLabel,
  secondaryActionHref,
}: StateCardProps) {
  return (
    <div className={`rounded-3xl border p-6 shadow-sm ${toneClass(tone)}`}>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm">{description}</p>

      {(primaryActionLabel && primaryActionHref) ||
      (secondaryActionLabel && secondaryActionHref) ? (
        <div className="mt-5 flex flex-wrap gap-3">
          {primaryActionLabel && primaryActionHref ? (
            <Link
              href={primaryActionHref}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              {primaryActionLabel}
            </Link>
          ) : null}

          {secondaryActionLabel && secondaryActionHref ? (
            <Link
              href={secondaryActionHref}
              className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {secondaryActionLabel}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}