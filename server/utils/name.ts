import { normalizeHumanName } from "@/server/utils/auth-normalizers";

export function buildDisplayName(firstName: string, lastName?: string | null) {
  const safeFirstName = normalizeHumanName(firstName);
  const safeLastName = lastName ? normalizeHumanName(lastName) : "";

  return [safeFirstName, safeLastName].filter(Boolean).join(" ");
}