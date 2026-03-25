import { normalizeHumanName } from "@/server/utils/auth-normalizers";

export function buildDisplayName(
  firstName?: string | null,
  lastName?: string | null
) {
  const safeFirstName = firstName ? normalizeHumanName(firstName) : "";
  const safeLastName = lastName ? normalizeHumanName(lastName) : "";

  return [safeFirstName, safeLastName].filter(Boolean).join(" ").trim();
}

export function splitLegacyFullName(fullName?: string | null) {
  const normalized = (fullName ?? "").trim().replace(/\s+/g, " ");

  if (!normalized) {
    return {
      firstName: "",
      lastName: null as string | null,
    };
  }

  const [firstName, ...rest] = normalized.split(" ");

  return {
    firstName,
    lastName: rest.length > 0 ? rest.join(" ") : null,
  };
}

export function resolveDisplayName(input: {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  email?: string | null;
}) {
  const fromParts = buildDisplayName(input.firstName, input.lastName);

  if (fromParts) {
    return fromParts;
  }

  const legacyFullName = (input.fullName ?? "").trim().replace(/\s+/g, " ");

  if (legacyFullName) {
    return legacyFullName;
  }

  return input.email?.trim() || "User";
}