"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  batchId: string;
  initialPrice: number | null;
  initialOriginalPrice: number | null;
  initialOfferEndDate: string | null;
  priceFormatted: string | null;
  originalPriceFormatted: string | null;
  discountPercent: number | null;
};

type ApiResponse = {
  success: boolean;
  message: string;
};

function paiseToBatches(paise: number | null): string {
  if (paise == null) return "";
  return String(paise / 100);
}

function rupeeStringToPaise(value: string): number | null {
  const num = parseFloat(value.trim());
  if (isNaN(num) || num < 0) return null;
  return Math.round(num * 100);
}

export function BatchPricingForm({
  batchId,
  initialPrice,
  initialOriginalPrice,
  initialOfferEndDate,
  priceFormatted,
  originalPriceFormatted,
  discountPercent,
}: Props) {
  const router = useRouter();

  const [priceRupees, setPriceRupees] = useState(
    paiseToBatches(initialPrice)
  );
  const [originalPriceRupees, setOriginalPriceRupees] = useState(
    paiseToBatches(initialOriginalPrice)
  );
  const [offerEndDate, setOfferEndDate] = useState(
    initialOfferEndDate
      ? new Date(initialOfferEndDate).toISOString().slice(0, 10)
      : ""
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const pricePaise = rupeeStringToPaise(priceRupees);
    const originalPricePaise = rupeeStringToPaise(originalPriceRupees);

    // Validate
    if (priceRupees.trim() && pricePaise === null) {
      setError("Invalid price value");
      setSaving(false);
      return;
    }

    if (
      pricePaise !== null &&
      originalPricePaise !== null &&
      pricePaise > originalPricePaise
    ) {
      setError("Price cannot be higher than original/strikethrough price");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/batches/${batchId}/pricing`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            price: priceRupees.trim() ? pricePaise : null,
            originalPrice: originalPriceRupees.trim()
              ? originalPricePaise
              : null,
            offerEndDate: offerEndDate
              ? new Date(offerEndDate).toISOString()
              : null,
          }),
        }
      );

      const json = (await response.json()) as ApiResponse;

      if (!response.ok || !json.success) {
        throw new Error(json.message || "Failed to save pricing");
      }

      setSuccess("Batch pricing saved successfully");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save pricing"
      );
    } finally {
      setSaving(false);
    }
  }

  // Live preview of discount
  const previewPricePaise = rupeeStringToPaise(priceRupees);
  const previewOriginalPaise = rupeeStringToPaise(originalPriceRupees);
  const previewDiscount =
    previewPricePaise !== null &&
    previewOriginalPaise !== null &&
    previewOriginalPaise > 0
      ? Math.round(
          ((previewOriginalPaise - previewPricePaise) /
            previewOriginalPaise) *
            100
        )
      : null;

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      {/* Current pricing summary */}
      {initialPrice != null ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 px-5 py-4">
          <span className="text-sm text-slate-500">Current pricing:</span>
          <span className="text-lg font-bold text-slate-900">
            {priceFormatted}
          </span>
          {originalPriceFormatted && (
            <span className="text-sm text-slate-400 line-through">
              {originalPriceFormatted}
            </span>
          )}
          {discountPercent != null && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              {discountPercent}% OFF
            </span>
          )}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-3">
        {/* Selling price */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">
            Selling Price (₹)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
              ₹
            </span>
            <input
              type="number"
              min="0"
              step="1"
              value={priceRupees}
              onChange={(e) => setPriceRupees(e.target.value)}
              placeholder="e.g. 299"
              className="w-full rounded-xl border py-3 pl-8 pr-4 text-sm"
            />
          </div>
          <p className="text-xs text-slate-400">
            What students pay. Leave blank for free.
          </p>
        </div>

        {/* Original/strikethrough price */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">
            Original Price (₹){" "}
            <span className="font-normal text-slate-400">(strikethrough)</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
              ₹
            </span>
            <input
              type="number"
              min="0"
              step="1"
              value={originalPriceRupees}
              onChange={(e) => setOriginalPriceRupees(e.target.value)}
              placeholder="e.g. 499"
              className="w-full rounded-xl border py-3 pl-8 pr-4 text-sm"
            />
          </div>
          <p className="text-xs text-slate-400">
            Shown as strikethrough on checkout.
          </p>
        </div>

        {/* Offer end date */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">
            Offer Ends On
          </label>
          <input
            type="date"
            value={offerEndDate}
            onChange={(e) => setOfferEndDate(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 text-sm text-slate-700"
          />
          <p className="text-xs text-slate-400">
            Show a deadline on the purchase page.
          </p>
        </div>
      </div>

      {/* Live preview */}
      {previewPricePaise != null && previewPricePaise > 0 ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
            Student will see:
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="text-xl font-bold text-blue-900">
              ₹{(previewPricePaise / 100).toFixed(0)}
            </span>
            {previewOriginalPaise != null &&
            previewOriginalPaise > previewPricePaise ? (
              <span className="text-base text-slate-400 line-through">
                ₹{(previewOriginalPaise / 100).toFixed(0)}
              </span>
            ) : null}
            {previewDiscount != null && previewDiscount > 0 ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">
                {previewDiscount}% OFF
              </span>
            ) : null}
            {offerEndDate ? (
              <span className="text-xs text-slate-500">
                · Offer ends{" "}
                {new Intl.DateTimeFormat("en-IN", {
                  dateStyle: "medium",
                }).format(new Date(offerEndDate))}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={saving}
        className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-400"
      >
        {saving ? "Saving..." : "Save Batch Pricing"}
      </button>
    </div>
  );
}