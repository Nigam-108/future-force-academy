import { getTurnstileSecretKey, isTurnstileEnabled } from "@/server/config/security";

type TurnstileSiteVerifyResponse = {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
  action?: string;
  cdata?: string;
};

export async function verifyTurnstileToken(input: {
  token?: string;
  ipAddress?: string;
}) {
  if (!isTurnstileEnabled()) {
    return {
      enabled: false,
      success: true,
      errorCodes: [] as string[],
      skipped: true,
    };
  }

  const token = input.token?.trim();
  if (!token) {
    return {
      enabled: true,
      success: false,
      errorCodes: ["missing-input-response"],
      skipped: false,
    };
  }

  const formData = new URLSearchParams();
  formData.set("secret", getTurnstileSecretKey());
  formData.set("response", token);

  if (input.ipAddress) {
    formData.set("remoteip", input.ipAddress);
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return {
      enabled: true,
      success: false,
      errorCodes: ["siteverify-request-failed"],
      skipped: false,
    };
  }

  const result = (await response.json()) as TurnstileSiteVerifyResponse;

  return {
    enabled: true,
    success: result.success,
    errorCodes: result["error-codes"] ?? [],
    hostname: result.hostname,
    action: result.action,
    challengeTs: result.challenge_ts,
    skipped: false,
  };
}
