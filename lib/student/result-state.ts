/**
 * E0 — Shared Student Foundation
 * result-state.ts
 *
 * Builds unified result summary data and resolves rank visibility.
 *
 * WHY this exists:
 * Three pages show result data — submitted page, results listing,
 * result detail page. Without this, each page had its own calculation
 * which caused inconsistencies. This file is the single source.
 *
 * Used by:
 * - submitted page (E2)
 * - results listing page (E2)
 * - result detail page (E2)
 * - merit rank panel component (E2)
 */

import {
  calculateSafePercentage,
  formatPercentageDisplay,
  formatScoreDisplay,
  formatScorePair,
  type NumericLike,
} from "@/lib/student/score-format";

// ─── Result summary types ─────────────────────────────────────────────────────

export type ResultSummaryInput = {
  totalMarksObtained?: NumericLike;
  totalMarks?: NumericLike;
  percentage?: NumericLike;
  correctCount?: NumericLike;
  wrongCount?: NumericLike;
  unansweredCount?: NumericLike;
  rank?: NumericLike;
};

export type ResultSummaryCardTone =
  | "default"
  | "success"
  | "danger"
  | "warning";

export type ResultSummaryCardItem = {
  key: string;
  label: string;
  value: string;
  caption?: string;
  tone?: ResultSummaryCardTone;
};

export type ResultSummaryState = {
  scoreText: string;
  percentageText: string;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  rankText: string;
  cards: ResultSummaryCardItem[];
};

// ─── Rank visibility types ────────────────────────────────────────────────────

export type RankBase = {
  rank: number;
  totalAttempted: number;
  myScore?: number;
  batchId?: string;
  batchTitle?: string;
};

/**
 * Config for controlling when rank is shown vs hidden.
 *
 * rankEnabled           → master switch. false = never show rank
 * resultVisible         → if admin hid results, hide rank too
 * freeRankRevealLimit   → for free batches: show rank for first N attempts only
 * currentFreeAttemptNumber → which attempt number is this student on
 * forcedHiddenReason    → custom message to show when rank is hidden
 */
export type RankVisibilityConfig = {
  rankEnabled?: boolean;
  resultVisible?: boolean;
  freeRankRevealLimit?: number | null;
  currentFreeAttemptNumber?: number | null;
  forcedHiddenReason?: string | null;
};

export type RankVisibilityState<T extends RankBase = RankBase> = {
  shouldShowRank: boolean;
  visibleRanks: T[];
  reason: string | null;
  blockedByRule: boolean;
};

// ─── Rank visibility resolver ─────────────────────────────────────────────────

/**
 * Resolves whether rank should be shown for a student.
 *
 * Priority of checks (first match wins):
 * 1. resultVisible = false → hide (admin hid results)
 * 2. rankEnabled = false → hide (rank feature off)
 * 3. freeRankRevealLimit exceeded → hide (paid upsell)
 * 4. forcedHiddenReason set → hide (custom rule)
 * 5. ranks array empty → don't show (no data yet)
 * 6. Otherwise → show rank
 */
export function resolveRankVisibility<T extends RankBase>(
  input: {
    ranks?: T[] | null;
  } & RankVisibilityConfig
): RankVisibilityState<T> {
  const ranks = input.ranks ?? [];

  // Rule 1 — Admin hid results entirely
  if (input.resultVisible === false) {
    return {
      shouldShowRank: false,
      visibleRanks: [],
      reason: "Results are currently hidden for this test.",
      blockedByRule: true,
    };
  }

  // Rule 2 — Rank feature disabled
  if (input.rankEnabled === false) {
    return {
      shouldShowRank: false,
      visibleRanks: [],
      reason: "Merit rank is currently disabled for this test.",
      blockedByRule: true,
    };
  }

  // Rule 3 — Free attempt limit exceeded (paid upsell gate)
  if (
    input.freeRankRevealLimit != null &&
    input.currentFreeAttemptNumber != null &&
    input.currentFreeAttemptNumber > input.freeRankRevealLimit
  ) {
    return {
      shouldShowRank: false,
      visibleRanks: [],
      reason:
        input.forcedHiddenReason ??
        `Merit rank is available for the first ${input.freeRankRevealLimit} free attempt${input.freeRankRevealLimit === 1 ? "" : "s"} only. Enroll in a paid batch to unlock full rankings.`,
      blockedByRule: true,
    };
  }

  // Rule 4 — Forced hidden by custom reason
  if (input.forcedHiddenReason) {
    return {
      shouldShowRank: false,
      visibleRanks: [],
      reason: input.forcedHiddenReason,
      blockedByRule: true,
    };
  }

  // Rule 5 — No rank data yet
  if (ranks.length === 0) {
    return {
      shouldShowRank: false,
      visibleRanks: [],
      reason: null,
      blockedByRule: false,
    };
  }

  // All checks passed — show rank
  return {
    shouldShowRank: true,
    visibleRanks: ranks,
    reason: null,
    blockedByRule: false,
  };
}

// ─── Result summary builder ───────────────────────────────────────────────────

/**
 * Builds unified result summary state for display.
 *
 * Percentage logic:
 * - If DB has a stored percentage → use it directly (it was calculated at submit time)
 * - If DB percentage is null/0 AND totalMarks > 0 → recalculate safely
 * - If totalMarks is 0 → percentage = 0 (never NaN)
 *
 * Score fractions:
 * - Fractional scores are VALID and EXPECTED when negative marking is on
 * - e.g. 3 correct (+1 each) - 2 wrong (-0.25 each) = 2.5 marks → "2.5"
 * - This is NOT a bug — formatScoreDisplay handles it correctly
 */
export function buildResultSummaryState(
  input: ResultSummaryInput
): ResultSummaryState {
  const correctCount = Math.max(
    typeof input.correctCount === "number" ? input.correctCount : 0,
    0
  );
  const wrongCount = Math.max(
    typeof input.wrongCount === "number" ? input.wrongCount : 0,
    0
  );
  const unansweredCount = Math.max(
    typeof input.unansweredCount === "number" ? input.unansweredCount : 0,
    0
  );

  // Score text — "obtained / total" or just "obtained"
  const scoreText =
    input.totalMarks != null
      ? formatScorePair(input.totalMarksObtained, input.totalMarks)
      : formatScoreDisplay(input.totalMarksObtained);

  // Percentage — prefer stored value, recalculate if missing
  let resolvedPercentage: number;
  if (
    typeof input.percentage === "number" &&
    Number.isFinite(input.percentage) &&
    input.percentage > 0
  ) {
    resolvedPercentage = input.percentage;
  } else {
    // Recalculate safely
    resolvedPercentage = calculateSafePercentage(
      input.totalMarksObtained,
      input.totalMarks
    );
  }

  const percentageText = formatPercentageDisplay(resolvedPercentage);
  const rankText =
    typeof input.rank === "number" && input.rank > 0
      ? `#${input.rank}`
      : "—";

  // Build summary cards for grid display
  const cards: ResultSummaryCardItem[] = [
    {
      key: "score",
      label: "Score",
      value: scoreText,
      tone: "default",
    },
    {
      key: "percentage",
      label: "Percentage",
      value: percentageText,
      tone:
        resolvedPercentage >= 60
          ? "success"
          : resolvedPercentage >= 35
            ? "warning"
            : "danger",
    },
    {
      key: "correct",
      label: "Correct",
      value: String(correctCount),
      tone: correctCount > 0 ? "success" : "default",
    },
    {
      key: "wrong",
      label: "Wrong",
      value: String(wrongCount),
      tone: wrongCount > 0 ? "danger" : "default",
    },
    {
      key: "unanswered",
      label: "Unanswered",
      value: String(unansweredCount),
      tone: "default",
    },
    {
      key: "rank",
      label: "Rank",
      value: rankText,
      tone: "default",
    },
  ];

  return {
    scoreText,
    percentageText,
    correctCount,
    wrongCount,
    unansweredCount,
    rankText,
    cards,
  };
}

/**
 * Backward-compatible alias.
 * Some older files may import this name.
 */
export const buildResultSummaryCards = buildResultSummaryState;