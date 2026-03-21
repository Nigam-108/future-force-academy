import { AppError } from "@/server/utils/errors";
import {
  countCouponUsagesByUser,
  countTotalCouponUsages,
  createCouponRecord,
  createCouponUsageRecord,
  findCouponByCode,
  findCouponById,
  getCouponStats,
  listCouponRecords,
  listCouponUsageRecords,
  toggleCouponActiveRecord,
  updateCouponRecord,
} from "@/server/repositories/coupon.repository";
import type {
  CreateCouponInput,
  ListCouponsQueryInput,
  UpdateCouponInput,
} from "@/server/validations/coupon.schema";
import { formatAmountFromPaise } from "@/server/repositories/payment.repository";

// ─── Admin coupon management ──────────────────────────────────────────────────

export async function listCoupons(input: ListCouponsQueryInput) {
  const result = await listCouponRecords(input);

  return {
    ...result,
    items: result.items.map((c) => ({
      ...c,
      discountLabel:
        c.discountType === "PERCENTAGE"
          ? `${c.discountValue}% off`
          : `${formatAmountFromPaise(c.discountValue)} off`,
      totalUsages: c._count.usages,
      usageRemaining:
        c.maxUsageLimit != null
          ? c.maxUsageLimit - c._count.usages
          : null,
    })),
    stats: await getCouponStats(),
  };
}

export async function getCouponDetail(couponId: string) {
  const coupon = await findCouponById(couponId);
  if (!coupon) throw new AppError("Coupon not found", 404);

  const usages = await listCouponUsageRecords(couponId);

  return {
    ...coupon,
    usages,
    totalUsages: coupon._count.usages,
    discountLabel:
      coupon.discountType === "PERCENTAGE"
        ? `${coupon.discountValue}% off`
        : `${formatAmountFromPaise(coupon.discountValue)} off`,
  };
}

export async function createCoupon(input: CreateCouponInput) {
  // Check code uniqueness
  const existing = await findCouponByCode(input.code);
  if (existing) {
    throw new AppError(
      `Coupon code "${input.code}" already exists`,
      409
    );
  }

  // Validate percentage <= 100
  if (input.discountType === "PERCENTAGE" && input.discountValue > 100) {
    throw new AppError("Percentage discount cannot exceed 100%", 400);
  }

  return createCouponRecord(input);
}

export async function updateCoupon(
  couponId: string,
  input: UpdateCouponInput
) {
  const existing = await findCouponById(couponId);
  if (!existing) throw new AppError("Coupon not found", 404);

  if (
    input.discountType === "PERCENTAGE" &&
    input.discountValue !== undefined &&
    input.discountValue > 100
  ) {
    throw new AppError("Percentage discount cannot exceed 100%", 400);
  }

  return updateCouponRecord(couponId, input);
}

export async function toggleCoupon(couponId: string, isActive: boolean) {
  const existing = await findCouponById(couponId);
  if (!existing) throw new AppError("Coupon not found", 404);

  return toggleCouponActiveRecord(couponId, isActive);
}

// ─── Student coupon validation ────────────────────────────────────────────────

type CouponValidationResult = {
  valid: true;
  couponId: string;
  code: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  discountLabel: string;
  originalAmountPaise: number;
  discountAmountPaise: number;
  finalAmountPaise: number;
} | {
  valid: false;
  reason: string;
};

/**
 * Validates a coupon code at checkout.
 * Returns full pricing breakdown if valid.
 */
export async function validateCoupon(
  code: string,
  batchId: string,
  userId: string,
  originalAmountPaise: number
): Promise<CouponValidationResult> {
  const coupon = await findCouponByCode(code);

  if (!coupon) {
    return { valid: false, reason: "Invalid coupon code" };
  }

  if (!coupon.isActive) {
    return { valid: false, reason: "This coupon is no longer active" };
  }

  if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
    return {
      valid: false,
      reason: `This coupon expired on ${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(coupon.expiresAt))}`,
    };
  }

  // Batch-specific check
  if (coupon.batchId && coupon.batchId !== batchId) {
    return {
      valid: false,
      reason: "This coupon is not valid for this batch",
    };
  }

  // Max usage limit
  if (coupon.maxUsageLimit !== null) {
    const totalUsages = await countTotalCouponUsages(coupon.id);
    if (totalUsages >= coupon.maxUsageLimit) {
      return {
        valid: false,
        reason: "This coupon has reached its maximum usage limit",
      };
    }
  }

  // Per-student limit
  const studentUsages = await countCouponUsagesByUser(coupon.id, userId);
  if (studentUsages >= coupon.perStudentLimit) {
    return {
      valid: false,
      reason:
        coupon.perStudentLimit === 1
          ? "You have already used this coupon"
          : `You can only use this coupon ${coupon.perStudentLimit} times`,
    };
  }

  // Calculate discount
  let discountAmountPaise: number;
  if (coupon.discountType === "PERCENTAGE") {
    discountAmountPaise = Math.floor(
      (originalAmountPaise * coupon.discountValue) / 100
    );
  } else {
    // FLAT discount — value is stored in paise
    discountAmountPaise = Math.min(
      coupon.discountValue,
      originalAmountPaise
    );
  }

  const finalAmountPaise = originalAmountPaise - discountAmountPaise;

  const discountLabel =
    coupon.discountType === "PERCENTAGE"
      ? `${coupon.discountValue}% off`
      : `${formatAmountFromPaise(coupon.discountValue)} off`;

  return {
    valid: true,
    couponId: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountLabel,
    originalAmountPaise,
    discountAmountPaise,
    finalAmountPaise,
  };
}

/**
 * Records coupon usage after payment is verified.
 * Called internally — not directly by API routes.
 */
export async function recordCouponUsage(
  couponId: string,
  userId: string,
  paymentId: string,
  discountApplied: number
) {
  return createCouponUsageRecord({
    couponId,
    userId,
    paymentId,
    discountApplied,
  });
}