"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TestOption = {
  testId: string;
  title: string;
  mode: string;
  totalQuestions: number;
  totalMarks: number;
  durationInMinutes: number | null;
  price: number;
  priceFormatted: string;
  isFree: boolean;
  alreadyPurchased: boolean;
};

type Props = {
  batchId: string;
  batchTitle: string;
  tests: TestOption[];
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
  } | null;
};

type VerifyResponse = {
  success: boolean;
  message: string;
};

declare global {
  interface Window {
    Razorpay: new (options: RzpOptions) => RzpInstance;
  }
}

type RzpOptions = {
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

type RzpInstance = { open: () => void };

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

function formatAmount(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(paise / 100);
}

function modeBadge(mode: string) {
  switch (mode) {
    case "LIVE":
      return "bg-rose-50 text-rose-700";
    case "PRACTICE":
      return "bg-violet-50 text-violet-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function BuySelectedTestsModal({
  batchId,
  batchTitle,
  tests,
}: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only paid + not already purchased tests are selectable
  const purchasableTests = tests.filter(
    (t) => !t.isFree && !t.alreadyPurchased
  );
  const freeTests = tests.filter((t) => t.isFree);
  const alreadyOwnedTests = tests.filter((t) => t.alreadyPurchased);

  // Total price of selected tests
  const totalPaise = Array.from(selectedIds).reduce((sum, id) => {
    const test = purchasableTests.find((t) => t.testId === id);
    return sum + (test?.price ?? 0);
  }, 0);

  function toggleTest(testId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(testId)) {
        next.delete(testId);
      } else {
        next.add(testId);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(purchasableTests.map((t) => t.testId)));
  }

  function clearAll() {
    setSelectedIds(new Set());
  }

  async function handlePay() {
    if (selectedIds.size === 0) {
      setError("Select at least one test to purchase");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load payment gateway");
      }

      const orderRes = await fetch("/api/student/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
          purchaseType: "INDIVIDUAL_TESTS",
          testIds: Array.from(selectedIds),
        }),
      });

      const orderJson = (await orderRes.json()) as OrderResponse;

      if (!orderRes.ok || !orderJson.success || !orderJson.data) {
        throw new Error(
          orderJson.message || "Failed to create payment order"
        );
      }

      const orderData = orderJson.data;

      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Future Force Academy",
        description: `${selectedIds.size} test${selectedIds.size !== 1 ? "s" : ""} from ${orderData.batchTitle}`,
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

        theme: { color: "#1D4ED8" },

        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      });

      razorpay.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setLoading(false);
    }
  }

  if (purchasableTests.length === 0) {
    return (
      <p className="text-xs text-slate-400 text-center">
        No individual tests available for purchase in this batch.
      </p>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setError(null);
          setSelectedIds(new Set());
        }}
        className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100"
      >
        Buy Selected Tests
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-16">
          <div className="w-full max-w-2xl rounded-3xl border bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Select Tests to Purchase
                </h2>
                <p className="text-sm text-slate-500">{batchTitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">

              {/* Select all / clear controls */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">
                  {selectedIds.size} of {purchasableTests.length} selected
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-xs font-medium text-slate-400 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Purchasable tests */}
              <div className="space-y-2">
                {purchasableTests.map((test) => {
                  const checked = selectedIds.has(test.testId);
                  return (
                    <label
                      key={test.testId}
                      className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition ${
                        checked
                          ? "border-blue-300 bg-blue-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTest(test.testId)}
                        className="h-4 w-4 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 truncate">
                          {test.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span
                            className={`rounded-full px-2 py-0.5 font-medium ${modeBadge(
                              test.mode
                            )}`}
                          >
                            {test.mode}
                          </span>
                          <span>
                            {test.totalQuestions} questions
                          </span>
                          <span>{test.totalMarks} marks</span>
                          {test.durationInMinutes ? (
                            <span>{test.durationInMinutes} min</span>
                          ) : null}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-bold text-slate-900">
                          {test.priceFormatted}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Already owned tests */}
              {alreadyOwnedTests.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Already Purchased
                  </p>
                  {alreadyOwnedTests.map((test) => (
                    <div
                      key={test.testId}
                      className="flex items-center gap-3 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 px-4 py-3 mb-2"
                    >
                      <span className="text-emerald-600">✓</span>
                      <p className="text-sm font-medium text-slate-700">
                        {test.title}
                      </p>
                      <span className="ml-auto text-xs font-medium text-emerald-600">
                        Owned
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Free tests info */}
              {freeTests.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Free Tests (included with any purchase)
                  </p>
                  {freeTests.map((test) => (
                    <div
                      key={test.testId}
                      className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 mb-2"
                    >
                      <p className="text-sm font-medium text-slate-600">
                        {test.title}
                      </p>
                      <span className="ml-auto text-xs font-medium text-slate-500">
                        Free
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="border-t px-6 py-4 space-y-3">
              {error ? (
                <p className="text-xs text-rose-600">{error}</p>
              ) : null}

              {/* Price summary */}
              {selectedIds.size > 0 ? (
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedIds.size} test
                      {selectedIds.size !== 1 ? "s" : ""} selected
                    </p>
                    <p className="text-xs text-slate-500">
                      Individual purchase — no access to future tests
                    </p>
                  </div>
                  <p className="text-xl font-bold text-slate-900">
                    {formatAmount(totalPaise)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center">
                  Select tests above to see total price
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => void handlePay()}
                  disabled={loading || selectedIds.size === 0}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {loading
                    ? "Processing..."
                    : selectedIds.size > 0
                    ? `Pay ${formatAmount(totalPaise)}`
                    : "Select tests to pay"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>

              <p className="text-xs text-slate-400 text-center">
                Secured by Razorpay · UPI, Cards, Net Banking accepted
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}