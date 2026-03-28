/**
 * E0 — Shared Student Foundation
 * attempt-state.ts
 *
 * Single source of truth for resolving what action state
 * a test is in from a student's perspective.
 *
 * Used by:
 * - student tests listing page (E1)
 * - test instructions page (E1)
 * - test card component (E1)
 *
 * NEVER duplicate this logic in pages/components.
 * Always import from here.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * All possible student-facing statuses for a test.
 * Comes from the backend API response.
 */
export type StudentTestStatus =
  | "AVAILABLE"
  | "UPCOMING"
  | "LIVE"
  | "COMPLETED";

/**
 * The resolved UI state for a student's interaction with a test.
 *
 * shouldBlockRetake    → test already attempted, block re-attempt
 * canOpenInstructions  → instructions page can be visited
 * canStartAttempt      → start/resume attempt button is active
 * isCompleted          → student already submitted this test
 * isScheduleOnly       → test is upcoming, show schedule info only
 * primaryLabel         → the main CTA button text
 * badgeLabel           → short badge text shown on test card
 */
export type StudentAttemptState = {
  status: StudentTestStatus;
  primaryLabel: string;
  badgeLabel: string;
  canOpenInstructions: boolean;
  canStartAttempt: boolean;
  shouldBlockRetake: boolean;
  isCompleted: boolean;
  isScheduleOnly: boolean;
};

// ─── Resolver ─────────────────────────────────────────────────────────────────

/**
 * Resolves the full UI state for a student test action.
 *
 * Rules:
 * - COMPLETED  → show "View Result", block re-attempt, grey out start button
 * - UPCOMING   → show "View Schedule", no start allowed
 * - LIVE/AVAILABLE → show "View Instructions", start allowed
 *
 * This is a pure function — no side effects, no API calls.
 * Safe to use in server components, client components, and utilities.
 */
export function resolveStudentAttemptState(
  input: Pick<{ studentStatus: StudentTestStatus }, "studentStatus">
): StudentAttemptState {
  switch (input.studentStatus) {
    case "COMPLETED":
      return {
        status: "COMPLETED",
        primaryLabel: "View Result",
        badgeLabel: "Attempted",
        canOpenInstructions: true,
        canStartAttempt: false,
        shouldBlockRetake: true,
        isCompleted: true,
        isScheduleOnly: false,
      };

    case "UPCOMING":
      return {
        status: "UPCOMING",
        primaryLabel: "View Schedule",
        badgeLabel: "Upcoming",
        canOpenInstructions: true,
        canStartAttempt: false,
        shouldBlockRetake: false,
        isCompleted: false,
        isScheduleOnly: true,
      };

    case "LIVE":
      return {
        status: "LIVE",
        primaryLabel: "View Instructions",
        badgeLabel: "Live Now",
        canOpenInstructions: true,
        canStartAttempt: true,
        shouldBlockRetake: false,
        isCompleted: false,
        isScheduleOnly: false,
      };

    case "AVAILABLE":
    default:
      return {
        status: "AVAILABLE",
        primaryLabel: "View Instructions",
        badgeLabel: "Available",
        canOpenInstructions: true,
        canStartAttempt: true,
        shouldBlockRetake: false,
        isCompleted: false,
        isScheduleOnly: false,
      };
  }
}

/**
 * Quick helper — returns just the CTA label.
 * Use when you only need the label text.
 */
export function getStudentTestActionLabel(
  input: Pick<{ studentStatus: StudentTestStatus }, "studentStatus">
): string {
  return resolveStudentAttemptState(input).primaryLabel;
}

/**
 * Quick helper — returns true if this test is blocked for re-attempt.
 * Use in test cards to grey out the button.
 */
export function isTestAlreadyAttempted(
  input: Pick<{ studentStatus: StudentTestStatus }, "studentStatus">
): boolean {
  return resolveStudentAttemptState(input).shouldBlockRetake;
}