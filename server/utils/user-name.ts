export function normalizeNamePart(value?: string | null) {
  return value?.trim().replace(/\s+/g, " ") || "";
}

export function buildUserFullName(firstName?: string | null, lastName?: string | null) {
  const safeFirst = normalizeNamePart(firstName);
  const safeLast = normalizeNamePart(lastName);

  return [safeFirst, safeLast].filter(Boolean).join(" ").trim() || "User";
}

export function splitFullName(fullName?: string | null) {
  const normalized = normalizeNamePart(fullName);

  if (!normalized) {
    return {
      firstName: "User",
      lastName: null as string | null,
    };
  }

  const parts = normalized.split(" ");
  const firstName = parts.shift() || "User";
  const lastName = parts.length ? parts.join(" ") : null;

  return {
    firstName,
    lastName,
  };
}