import { z } from "zod";

/**
 * batchIds can be empty — empty array means "make this test global".
 */
export const assignBatchesToTestSchema = z.object({
  batchIds: z.array(z.string().min(1)),
});

export type AssignBatchesToTestInput = z.infer<typeof assignBatchesToTestSchema>;