/**
 * E0 — Shared Student Foundation
 * timer-urgency.ts
 *
 * Resolves timer warning states for the live attempt page.
 *
 * Levels:
 * - "normal"   → plenty of time left
 * - "warning"  → less than 5 minutes (amber UI)
 * - "critical" → less than 1 minute (red UI)
 * - "expired"  → timer hit 0
 *
 * Also handles:
 * - Section-wise timing (separate urgency for each section)
 * - Last-1-minute warning flag for section end
 *
 * Used by:
 * - attempt-page-client.tsx (E4, E5)
 * - test-timer-bar.tsx (E5)
 * - section-notices.tsx (E4)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type TimerUrgencyLevel =
  | "normal"
  | "warning"
  | "critical"
  | "expired";

export type TimerThresholds = {
  /** Seconds below which timer enters "warning" state (amber). Default: 300 = 5 min */
  warningSeconds: number;
  /** Seconds below which timer enters "critical" state (red). Default: 60 = 1 min */
  criticalSeconds: number;
};

export type TimerUrgencyState = {
  overallLevel: TimerUrgencyLevel;
  sectionLevel: TimerUrgencyLevel;
  isOverallLowTime: boolean;
  isCurrentSectionLowTime: boolean;
  isOverallCritical: boolean;
  isCurrentSectionCritical: boolean;
  /**
   * True when section has less than criticalSeconds remaining AND
   * section-wise timing is active.
   * Use this to show the "1 minute left in this section" warning banner.
   */
  showSectionEndingWarning: boolean;
};

// ─── Constants ────────────────────────────────────────────────────────────────

export const DEFAULT_TIMER_THRESHOLDS: TimerThresholds = {
  warningSeconds: 300, // 5 minutes
  criticalSeconds: 60, // 1 minute
};

// ─── Core resolver ────────────────────────────────────────────────────────────

/**
 * Resolves urgency level for a single timer value.
 *
 * null → "normal" (timer not started or not applicable)
 * <= 0 → "expired"
 * <= criticalSeconds → "critical"
 * <= warningSeconds → "warning"
 * otherwise → "normal"
 */
export function resolveTimerUrgency(
  secondsLeft: number | null,
  thresholds?: Partial<TimerThresholds>
): TimerUrgencyLevel {
  if (secondsLeft === null) return "normal";
  if (secondsLeft <= 0) return "expired";

  const effective: TimerThresholds = {
    ...DEFAULT_TIMER_THRESHOLDS,
    ...thresholds,
  };

  if (secondsLeft <= effective.criticalSeconds) return "critical";
  if (secondsLeft <= effective.warningSeconds) return "warning";
  return "normal";
}

/**
 * Builds the full timer urgency state for the attempt page.
 *
 * Handles both overall timer and current section timer independently.
 * Section urgency is only relevant when isSectionWiseTiming is true.
 */
export function buildTimerUrgencyState(input: {
  overallSecondsLeft: number | null;
  currentSectionSecondsLeft: number | null;
  isSectionWiseTiming: boolean;
  thresholds?: Partial<TimerThresholds>;
}): TimerUrgencyState {
  const overallLevel = resolveTimerUrgency(
    input.overallSecondsLeft,
    input.thresholds
  );

  const sectionLevel = input.isSectionWiseTiming
    ? resolveTimerUrgency(input.currentSectionSecondsLeft, input.thresholds)
    : "normal";

  return {
    overallLevel,
    sectionLevel,
    isOverallLowTime:
      overallLevel === "warning" || overallLevel === "critical",
    isCurrentSectionLowTime:
      sectionLevel === "warning" || sectionLevel === "critical",
    isOverallCritical: overallLevel === "critical",
    isCurrentSectionCritical: sectionLevel === "critical",
    showSectionEndingWarning:
      input.isSectionWiseTiming &&
      input.currentSectionSecondsLeft !== null &&
      input.currentSectionSecondsLeft > 0 &&
      sectionLevel === "critical",
  };
}

/**
 * Converts urgency level to Tailwind CSS class names for the timer box.
 * Returns an object with border, background, and text class names.
 */
export function getTimerUrgencyClasses(level: TimerUrgencyLevel): {
  borderClassName: string;
  backgroundClassName: string;
  textClassName: string;
} {
  switch (level) {
    case "critical":
      return {
        borderClassName: "border-rose-200",
        backgroundClassName: "bg-rose-50",
        textClassName: "text-rose-700",
      };
    case "warning":
      return {
        borderClassName: "border-amber-200",
        backgroundClassName: "bg-amber-50",
        textClassName: "text-amber-700",
      };
    case "expired":
      return {
        borderClassName: "border-rose-300",
        backgroundClassName: "bg-rose-100",
        textClassName: "text-rose-800",
      };
    case "normal":
    default:
      return {
        borderClassName: "border-slate-200",
        backgroundClassName: "bg-white",
        textClassName: "text-slate-900",
      };
  }
}