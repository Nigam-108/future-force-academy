export function isTurnstileEnabled() {
  return (
    process.env.TURNSTILE_ENABLED === "true" &&
    Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) &&
    Boolean(process.env.TURNSTILE_SECRET_KEY)
  );
}

export function getTurnstileSiteKey() {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
}

export function getTurnstileSecretKey() {
  return process.env.TURNSTILE_SECRET_KEY ?? "";
}

export function getSignupSecurityWindowMinutes() {
  return 15;
}
