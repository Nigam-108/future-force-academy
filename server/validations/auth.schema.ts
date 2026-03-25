import { z } from "zod";

const humanNameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be at most 50 characters")
  .regex(/^[A-Za-z][A-Za-z\s'-]*$/, "Enter a valid name");

const optionalHumanNameSchema = z
  .string()
  .trim()
  .max(50, "Name must be at most 50 characters")
  .regex(/^[A-Za-z\s'-]*$/, "Enter a valid name")
  .optional()
  .or(z.literal(""));

export const signupSchema = z.object({
  firstName: humanNameSchema,
  lastName: optionalHumanNameSchema,
  email: z.string().trim().email("Enter a valid email"),
  mobileNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Mobile number must be 10 digits")
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),
});

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Email or mobile number is required"),
  password: z.string().min(1, "Password is required"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;