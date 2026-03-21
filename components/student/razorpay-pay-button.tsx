"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  batchId: string;
  batchTitle: string;
  isPaid: boolean;
};

type OrderResponse = {
  success: boolean;
  message: string;
  data: {
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

// Declare Razorpay on window
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
  prefill: {
    name: string;
    email: string;
  };
  theme: { color: string };
  modal: {
    ondismiss: () => void;
  };
};

type RazorpayInstance = {
  open: () => void;
};

/**
 * Loads the Razorpay checkout script dynamically.
 */
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

export function RazorpayPayButton({ batchId, batchTitle, isPaid }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handlePayNow() {
    setLoading(true);
    setErrorMessage(null);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error(
          "Failed to load payment gateway. Check your internet connection."
        );
      }

      // Create order
      const orderRes = await fetch("/api/student/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId }),
      });

      const orderJson = (await orderRes.json()) as OrderResponse;

      if (!orderRes.ok || !orderJson.success || !orderJson.data) {
        throw new Error(orderJson.message || "Failed to create payment order.");
      }

      const orderData = orderJson.data;

      // Open Razorpay checkout
      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Future Force Academy",
        description: `Enrollment — ${orderData.batchTitle}`,
        order_id: orderData.orderId,

        handler: async function (response) {
          // Verify payment after success
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
              setErrorMessage(
                "Payment was received but verification failed. Please contact support."
              );
              return;
            }

            // Success — redirect to purchases page
            router.push("/student/purchases?payment=success");
            router.refresh();
          } catch {
            setErrorMessage(
              "Payment received but an error occurred. Please contact support."
            );
          } finally {
            setLoading(false);
          }
        },

        prefill: {
          name: orderData.studentName,
          email: orderData.studentEmail,
        },

        theme: {
          color: "#0F172A",
        },

        modal: {
          ondismiss: () => {
            setLoading(false);
            setErrorMessage("Payment cancelled. You can try again anytime.");
          },
        },
      });

      razorpay.open();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Payment failed. Try again."
      );
      setLoading(false);
    }
  }

  if (!isPaid) {
    return (
      <p className="text-sm text-slate-500">
        This is a free batch. Contact admin for enrollment.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void handlePayNow()}
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
      >
        {loading ? "Processing..." : `Pay & Enroll in ${batchTitle}`}
      </button>

      {errorMessage ? (
        <p className="text-xs text-rose-600">{errorMessage}</p>
      ) : null}

      <p className="text-xs text-slate-500 text-center">
        Secured by Razorpay · UPI, Cards, Net Banking accepted
      </p>
    </div>
  );
}