/**
 * E0 — Shared Student Foundation
 * payment-breakdown.ts
 *
 * Calculates the full payment breakdown for student checkout.
 *
 * Handles:
 * - Base amount (batch price in paise)
 * - Coupon discount
 * - Platform fee (2% — applied AFTER discount, on net amount)
 * - Final total payable
 *
 * All amounts are in PAISE internally.
 * Use formatInrAmount() only for display.
 *
 * Used by:
 * - buy-full-batch-button.tsx (E7)
 * - buy-selected-tests-modal.tsx (E7)
 * - pricing.service.ts (E7)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type StudentPaymentBreakdownInput = {
  /** Base price in paise (e.g. 49900 = ₹499) */
  baseAmount: number;
  /** Coupon discount amount in paise */
  discountAmount?: number;
  /**
   * Platform fee rate as a decimal (e.g. 0.02 = 2%)
   * Default: 0.02 (2%)
   */
  platformFeeRate?: number;
  /**
   * Whether to include platform fee in this checkout.
   * Set true for all paid batch/test purchases.
   * Default: false (will be enabled in E7)
   */
  includePlatformFee?: boolean;
};

export type StudentPaymentBreakdown = {
  /** Original batch/test price in paise */
  baseAmount: number;
  /** Coupon discount in paise */
  discountAmount: number;
  /** baseAmount - discountAmount in paise */
  netAmount: number;
  /** Platform fee on netAmount in paise */
  platformFee: number;
  /** netAmount + platformFee in paise — this is what Razorpay charges */
  totalPayable: number;
  /** Platform fee rate used (for display) */
  platformFeeRatePercent: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Rounds currency to nearest paisa safely */
function roundPaise(value: number): number {
  return Math.round(value + Number.EPSILON);
}

// ─── Main calculator ──────────────────────────────────────────────────────────

/**
 * Builds full payment breakdown.
 *
 * Platform fee formula:
 *   platformFee = ceil(netAmount * platformFeeRate)
 *   (ceil used so we never undercharge — matches payment gateway rounding)
 *
 * Example (₹499 batch, ₹50 coupon, 2% fee):
 *   baseAmount   = 49900 paise
 *   discountAmount = 5000 paise
 *   netAmount    = 44900 paise
 *   platformFee  = ceil(44900 * 0.02) = ceil(898) = 898 paise = ₹8.98
 *   totalPayable = 44900 + 898 = 45798 paise = ₹457.98
 */
export function buildStudentPaymentBreakdown(
  input: StudentPaymentBreakdownInput
): StudentPaymentBreakdown {
  const baseAmount = Math.max(roundPaise(input.baseAmount), 0);
  const discountAmount = Math.max(
    roundPaise(input.discountAmount ?? 0),
    0
  );
  const netAmount = Math.max(baseAmount - discountAmount, 0);

  const platformFeeRate = input.platformFeeRate ?? 0.02; // 2% default
  const includePlatformFee = input.includePlatformFee ?? false;

  const platformFee = includePlatformFee
    ? Math.ceil(netAmount * platformFeeRate)
    : 0;

  return {
    baseAmount,
    discountAmount,
    netAmount,
    platformFee,
    totalPayable: netAmount + platformFee,
    platformFeeRatePercent: Math.round(platformFeeRate * 100),
  };
}

// ─── Display formatters ───────────────────────────────────────────────────────

/**
 * Formats a paise amount to INR display string.
 * Example: 49900 → "₹499"  |  45798 → "₹457.98"
 */
export function formatInrAmount(paiseAmount: number): string {
  const rupees = paiseAmount / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Formats a paise amount to plain number string (no ₹ symbol).
 * Example: 49900 → "499"
 */
export function formatInrPlain(paiseAmount: number): string {
  const rupees = paiseAmount / 100;
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}