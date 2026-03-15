import { LanguageCode } from "@prisma/client";
import { z } from "zod";

export const updateStudentProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters long.").optional(),
  mobileNumber: z.string().min(6).max(20).nullable().optional(),
  preferredLanguage: z.nativeEnum(LanguageCode).optional(),
});

export type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileSchema>;