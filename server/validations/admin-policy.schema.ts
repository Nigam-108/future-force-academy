import { z } from "zod";

export const updatePolicyDraftSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  summary: z.string().trim().max(500).optional().or(z.literal("")),
  contentMarkdown: z
    .string()
    .trim()
    .min(20, "Policy content must be at least 20 characters"),
});