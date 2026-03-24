import { z } from "zod";

export const policyPageQuerySchema = z.object({
  version: z
    .string()
    .trim()
    .optional()
    .transform((value) => {
      if (!value) return undefined;

      const asNumber = Number(value);
      return Number.isFinite(asNumber) ? asNumber : undefined;
    }),
  versionId: z.string().trim().optional(),
  updated: z
    .string()
    .trim()
    .optional()
    .transform((value) => value === "1"),
  summary: z.string().trim().optional(),
});