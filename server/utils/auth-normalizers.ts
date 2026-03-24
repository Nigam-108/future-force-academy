export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeHumanName(value: string) {
  return normalizeWhitespace(value);
}

export function normalizeMobileNumber(value: string) {
  const digitsOnly = value.replace(/\D/g, "");
  return digitsOnly.slice(-10);
}

export function isValidIndianMobileNumber(value: string) {
  return /^[6-9]\d{9}$/.test(value);
}

export function isValidEmailFormat(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function maskEmail(value: string) {
  const normalized = normalizeEmail(value);
  const [localPart, domain] = normalized.split("@");

  if (!localPart || !domain) {
    return normalized;
  }

  if (localPart.length <= 2) {
    return `${localPart[0] ?? "*"}*@${domain}`;
  }

  return `${localPart[0]}${"*".repeat(Math.max(1, localPart.length - 2))}${localPart[localPart.length - 1]}@${domain}`;
}