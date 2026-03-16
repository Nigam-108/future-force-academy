import { z } from "zod";

/**
 * Validation schema for the bulk import request body.
 *
 * Why this exists:
 * - keeps API input validation clean
 * - ensures admin sends non-empty raw text
 * - central place to extend future import options
 */
export const bulkImportQuestionsSchema = z.object({
  rawText: z
    .string()
    .trim()
    .min(10, "Please paste valid question content for import."),
});

/**
 * Type used in service/controller layers.
 */
export type BulkImportQuestionsInput = z.infer<
  typeof bulkImportQuestionsSchema
>;