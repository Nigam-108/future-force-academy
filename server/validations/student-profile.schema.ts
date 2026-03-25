import { LanguageCode } from "@prisma/client";
import { z } from "zod";

const firstNameSchema = z
  .string()
  .trim()
  .min(2, "First name must be at least 2 characters")
  .max(50, "First name must be at most 50 characters")
  .regex(/^[A-Za-z][A-Za-z\s'-]*$/, "Enter a valid first name")
  .optional();

const lastNameSchema = z
  .string()
  .trim()
  .max(50, "Last name must be at most 50 characters")
  .regex(/^[A-Za-z\s'-]*$/, "Enter a valid last name")
  .optional()
  .nullable()
  .or(z.literal(""));

export const updateStudentProfileSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  mobileNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Mobile number must be 10 digits")
    .optional()
    .nullable()
    .or(z.literal("")),
  preferredLanguage: z.nativeEnum(LanguageCode).optional(),
});

export type UpdateStudentProfileInput = z.infer<
  typeof updateStudentProfileSchema
>;