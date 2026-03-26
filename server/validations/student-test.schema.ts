import { TestMode } from "@prisma/client";
import { z } from "zod";

export const studentTestStatusValues = [
  "AVAILABLE",
  "UPCOMING",
  "LIVE",
  "COMPLETED",
] as const;

export const listStudentTestsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  mode: z.nativeEnum(TestMode).optional(),
  studentStatus: z.enum(studentTestStatusValues).optional(),
  batchId: z.string().optional(),
});

export type ListStudentTestsQueryInput = z.infer<
  typeof listStudentTestsQuerySchema
>;

export type StudentTestStatus = (typeof studentTestStatusValues)[number];