import { z } from "zod";

const nameRegex = /^[A-Za-z ]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const signupAvailabilitySchema = z
  .object({
    email: z.string().optional(),
    mobileNumber: z.string().optional(),
  })
  .refine((value) => Boolean(value.email || value.mobileNumber), {
    message: "Email or mobile number is required",
    path: ["email"],
  });

export const signupStartSchema = z
  .object({
    firstName: z.string().trim().min(2).max(50),
    lastName: z.string().trim().max(50).optional().or(z.literal("")),
    email: z.string().trim().email(),
    mobileNumber: z.string().trim().min(10).max(20),
    password: z.string().regex(passwordRegex, {
      message: "Password must be at least 8 characters and include uppercase, lowercase, and a number",
    }),
    confirmPassword: z.string(),
    acceptPolicies: z.boolean().refine((value) => value === true, {
      message: "You must agree to the policies",
    }),
    confirmSingleAccount: z.boolean().refine((value) => value === true, {
      message: "You must confirm the one-account rule",
    }),
    marketingEmailsEnabled: z.boolean().optional().default(true),
  })
  .refine((value) => nameRegex.test(value.firstName), {
    message: "First name can contain only letters and spaces",
    path: ["firstName"],
  })
  .refine((value) => {
    if (!value.lastName) return true;
    return nameRegex.test(value.lastName);
  }, {
    message: "Last name can contain only letters and spaces",
    path: ["lastName"],
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const continueVerificationSchema = z.object({
  email: z.string().trim().email(),
});

export const resendOtpSchema = z.object({
  email: z.string().trim().email(),
});

export const verifySignupOtpSchema = z.object({
  email: z.string().trim().email(),
  otp: z.string().trim().regex(/^\d{4}$/, {
    message: "OTP must be a 4-digit number",
  }),
});