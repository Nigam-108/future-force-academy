import { createHash, randomInt, timingSafeEqual } from "crypto";

export function generateNumericOtp(length = 4) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;

  return String(randomInt(min, max + 1));
}

export function hashOtp(otp: string) {
  return createHash("sha256").update(otp).digest("hex");
}

export function verifyOtpHash(otp: string, storedHash: string) {
  const incoming = Buffer.from(hashOtp(otp), "hex");
  const existing = Buffer.from(storedHash, "hex");

  if (incoming.length !== existing.length) {
    return false;
  }

  return timingSafeEqual(incoming, existing);
}