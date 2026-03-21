"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  batchId: string;
  batchTitle: string;
  price: number;
  originalPrice: number | null;
  discountPercent: number | null;
  offerEndDate: string | null;
  priceFormatted: string;
  originalPriceFormatted: string | null;
};

type CouponValidateResponse = {
  success: boolean;
  message: string;
  data?: {
    valid: boolean;
    couponId: string;
    code: string;
    discountLabel: string;
    originalAmountPaise: number;
    discountAmountPaise: number;
    finalAmountPaise: number;
  };
};

type OrderResponse = {
  success: boolean;
  message: string;
  data?: {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    paymentId: string;
    batchTitle: string;
    studentName: string;
    studentEmail: string;
    purchaseType: string;
  } | null;
};

type VerifyResponse = {
  success: boolean;
  message: string;
};

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  prefill: { name: string; email: string };
  theme: { color: string };
  modal: { ondismiss: () => void };
};

type RazorpayInstance = { open: () => void };

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window.Razorpay !== "undefined") {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
    new Date(value)
  );
}

// ADD THIS before the component function:
type CouponApplied = {
  valid: boolean;
  couponId: string;
  code: string;
  discountLabel: string;
  originalAmountPaise: number;
  discountAmountPaise: number;
  finalAmountPaise: number;
};

export function BuyFullBatchButton({
  batchId,
  batchTitle,
  price,
  originalPrice,
  discountPercent,
  offerEndDate,
  priceFormatted,
  originalPriceFormatted,
}: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  // REPLACE WITH:
  const [couponResult, setCouponResult] = useState<CouponApplied | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const finalPrice = couponResult
    ? couponResult.finalAmountPaise
    : price;

  const finalPriceFormatted = couponResult
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
      }).format(couponResult.finalAmountPaise / 100)
    : priceFormatted;

  async function handleValidateCoupon() {
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError(null);
    setCouponResult(null);

    try {
      const response = await fetch("/api/student/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          batchId,
        }),
      });

      const json = (await response.json()) as CouponValidateResponse;

      if (!response.ok || !json.success || !json.data) {
        throw new Error(json.message || "Invalid coupon");
      }

      setCouponResult(json.data);
    } catch (err) {
      setCouponError(
        err instanceof Error ? err.message : "Invalid coupon code"
      );
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setCouponCode("");
    setCouponResult(null);
    setCouponError(null);
  }

  async function handlePay() {
    setLoading(true);
    setError(null);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load payment gateway. Check your internet.");
      }

      // Create order
      const orderRes = await fetch("/api/student/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
          purchaseType: "FULL_BATCH",
          ...(couponResult ? { couponCode: couponResult.code } : {}),
        }),
      });

      const orderJson = (await orderRes.json()) as OrderResponse;

      if (!orderRes.ok || !orderJson.success || !orderJson.data) {
        throw new Error(orderJson.message || "Failed to create payment order");
      }

      const orderData = orderJson.data;

      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Future Force Academy",
        description: `Full Batch — ${orderData.batchTitle}`,
        order_id: orderData.orderId,

        handler: async function (response) {
          try {
            const verifyRes = await fetch("/api/student/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const verifyJson = (await verifyRes.json()) as VerifyResponse;

            if (!verifyRes.ok || !verifyJson.success) {
              setError(
                "Payment received but verification failed. Contact support."
              );
              return;
            }

            setOpen(false);
            router.push("/student/purchases?payment=success");
            router.refresh();
          } catch {
            setError("Verification error. Contact support.");
          } finally {
            setLoading(false);
          }
        },

        prefill: {
          name: orderData.studentName,
          email: orderData.studentEmail,
        },

        theme: { color: "#0F172A" },

        modal: {
          ondismiss: () => {
            setLoading(false);
            setError("Payment cancelled. You can try again anytime.");
          },
        },
      });

      razorpay.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed.");
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setError(null);
        }}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Buy Full Batch
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
      {/* Price display */}
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Full Batch Access
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-2xl font-bold text-slate-900">
            {finalPriceFormatted}
          </span>

          {originalPriceFormatted && !couponResult ? (
            <span className="text-sm text-slate-400 line-through">
              {originalPriceFormatted}
            </span>
          ) : null}

          {couponResult ? (
            <span className="text-sm text-slate-400 line-through">
              {priceFormatted}
            </span>
          ) : null}

          {discountPercent != null && !couponResult ? (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
              {discountPercent}% OFF
            </span>
          ) : null}

          {couponResult ? (
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              {couponResult.discountLabel} applied
            </span>
          ) : null}
        </div>

        {offerEndDate && !couponResult ? (
          <p className="text-xs text-rose-600 font-medium">
            ⏰ Offer ends {formatDate(offerEndDate)}
          </p>
        ) : null}

        <p className="text-xs text-slate-500">
          Access all tests + future tests added to this batch
        </p>
      </div>

      {/* Coupon section */}
      {!couponResult ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-600">
            Have a coupon code?
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                setCouponError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleValidateCoupon();
              }}
              placeholder="Enter code"
              className="flex-1 rounded-xl border px-3 py-2 text-sm font-mono uppercase"
            />
            <button
              type="button"
              onClick={() => void handleValidateCoupon()}
              disabled={couponLoading || !couponCode.trim()}
              className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            >
              {couponLoading ? "..." : "Apply"}
            </button>
          </div>
          {couponError ? (
            <p className="text-xs text-rose-600">{couponError}</p>
          ) : null}
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
          <div>
            <p className="text-xs font-bold text-emerald-800">
              ✅ {couponResult.code} — {couponResult.discountLabel}
            </p>
            <p className="text-xs text-emerald-600">
              You save{" "}
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                minimumFractionDigits: 0,
              }).format(couponResult.discountAmountPaise / 100)}
            </p>
          </div>
          <button
            type="button"
            onClick={removeCoupon}
            className="text-xs font-medium text-emerald-700 hover:underline"
          >
            Remove
          </button>
        </div>
      )}

      {/* Error */}
      {error ? (
        <p className="text-xs text-rose-600">{error}</p>
      ) : null}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void handlePay()}
          disabled={loading}
          className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-400"
        >
          {loading
            ? "Processing..."
            : `Pay ${finalPriceFormatted}`}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            removeCoupon();
            setError(null);
          }}
          className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>

      <p className="text-xs text-slate-400 text-center">
        Secured by Razorpay · UPI, Cards, Net Banking accepted
      </p>
    </div>
  );
}