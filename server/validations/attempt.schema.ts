import { z } from "zod";

export const startAttemptSchema = z.object({
  testId: z.string().trim().min(1, "testId is required."),
});

export type StartAttemptInput = z.infer<typeof startAttemptSchema>;