/**
 * E0 — Shared Student Foundation
 * score-format.ts
 *
 * Safe, consistent formatters for scores, percentages, and marks.
 *
 * Key guarantees:
 * - NEVER returns NaN, Infinity, or undefined
 * - Handles null/undefined inputs gracefully
 * - Fractional scores are shown correctly (negative marking)
 * - Zero total marks → 0% (not NaN)
 *
 * Used by:
 * - result-state.ts (E0)
 * - submitted page (E2)
 * - result detail page (E2)
 * - result listing page (E2)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type NumericLike = number | null | undefined;

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Converts any numeric-like value to a safe finite number.
 * null / undefined / NaN / Infinity → 0
 */
function toSafeNumber(value: NumericLike): number {
  if (typeof value !== "number") return 0;
  if (!Number.isFinite(value)) return 0;
  return value;
}

// ─── Core formatters ──────────────────────────────────────────────────────────

/**
 * Calculates percentage safely.
 *
 * - If total is 0 or invalid → returns 0 (not NaN)
 * - Rounds to `precision` decimal places (default 2)
 * - Clamps result between 0 and 100
 *
 * Example:
 *   calculateSafePercentage(45, 60) → 75
 *   calculateSafePercentage(null, 0) → 0
 *   calculateSafePercentage(7, 0)   → 0   ← no division by zero
 */
export function calculateSafePercentage(
  obtained: NumericLike,
  total: NumericLike,
  precision = 2
): number {
  const safeTotal = toSafeNumber(total);

  // Guard against division by zero
  if (safeTotal <= 0) return 0;

  const safeObtained = toSafeNumber(obtained);
  const raw = (safeObtained / safeTotal) * 100;

  // Guard against Infinity / NaN from floating point
  if (!Number.isFinite(raw)) return 0;

  // Clamp to valid percentage range
  const clamped = Math.min(Math.max(raw, 0), 100);
  const factor = 10 ** precision;

  return Math.round(clamped * factor) / factor;
}

/**
 * Formats a score value for display.
 *
 * - Whole numbers → shown without decimals (e.g. "45")
 * - Fractional scores → shown with up to 2 decimals (e.g. "44.5")
 *   This is CORRECT behavior — negative marking creates fractional scores
 * - null / undefined → "0"
 *
 * Example:
 *   formatScoreDisplay(45)    → "45"
 *   formatScoreDisplay(44.5)  → "44.5"
 *   formatScoreDisplay(null)  → "0"
 */
export function formatScoreDisplay(
  value: NumericLike,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const safe = toSafeNumber(value);
  const hasFraction = !Number.isInteger(safe);

  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    maximumFractionDigits:
      options?.maximumFractionDigits ?? (hasFraction ? 2 : 0),
  }).format(safe);
}

/**
 * Formats a percentage value for display.
 *
 * Example:
 *   formatPercentageDisplay(75)    → "75%"
 *   formatPercentageDisplay(75.25) → "75.25%"
 *   formatPercentageDisplay(null)  → "0%"
 */
export function formatPercentageDisplay(
  value: NumericLike,
  options?: {
    maximumFractionDigits?: number;
    suffix?: string;
  }
): string {
  const safe = toSafeNumber(value);
  const hasFraction = !Number.isInteger(safe);

  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits:
      options?.maximumFractionDigits ?? (hasFraction ? 2 : 0),
  }).format(safe);

  return `${formatted}${options?.suffix ?? "%"}`;
}

/**
 * Formats a score pair for display — "obtained / total"
 *
 * Example:
 *   formatScorePair(45, 60)   → "45 / 60"
 *   formatScorePair(44.5, 60) → "44.5 / 60"
 */
export function formatScorePair(
  obtained: NumericLike,
  total: NumericLike
): string {
  return `${formatScoreDisplay(obtained)} / ${formatScoreDisplay(total)}`;
}