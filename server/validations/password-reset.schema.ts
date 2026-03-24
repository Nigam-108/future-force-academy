import { z } from "zod";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const forgotPasswordStartSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export const forgotPasswordResetSchema = z
  .object({
    email: z.string().trim().email("Enter a valid email address"),
    otp: z.string().trim().regex(/^\d{6}$/, {
      message: "OTP must be a 6-digit number",
    }),
    newPassword: z.string().regex(passwordRegex, {
      message:
        "Password must be at least 8 characters and include uppercase, lowercase, and a number",
    }),
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });