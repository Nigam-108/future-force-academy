"use client";

// Legacy component — superseded by BuyFullBatchButton and BuySelectedTestsModal
// Keeping for backward compatibility

import { BuyFullBatchButton } from "@/components/student/buy-full-batch-button";

type Props = {
  batchId: string;
  batchTitle: string;
  isPaid: boolean;
  price?: number;
  priceFormatted?: string;
};

export function RazorpayPayButton({
  batchId,
  batchTitle,
  isPaid,
  price,
  priceFormatted,
}: Props) {
  if (!isPaid || !price) {
    return (
      <p className="text-sm text-slate-500">
        This is a free batch. Contact admin for enrollment.
      </p>
    );
  }

  return (
    <BuyFullBatchButton
      batchId={batchId}
      batchTitle={batchTitle}
      price={price}
      originalPrice={null}
      discountPercent={null}
      offerEndDate={null}
      priceFormatted={priceFormatted ?? `₹${price / 100}`}
      originalPriceFormatted={null}
    />
  );
}