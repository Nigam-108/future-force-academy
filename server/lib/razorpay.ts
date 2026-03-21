import Razorpay from "razorpay";

/**
 * Razorpay client singleton.
 *
 * Uses test keys in development, live keys in production.
 * Never expose key_secret to the frontend.
 */

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  throw new Error(
    "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables."
  );
}

declare global {
  // eslint-disable-next-line no-var
  var razorpayGlobal: Razorpay | undefined;
}

export const razorpay =
  global.razorpayGlobal ??
  new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

if (process.env.NODE_ENV !== "production") {
  global.razorpayGlobal = razorpay;
}