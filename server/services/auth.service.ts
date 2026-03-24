import { comparePassword, hashPassword } from "@/server/auth/password";
import { AppError } from "@/server/utils/errors";
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByMobileNumber,
} from "@/server/repositories/user.repository";
import { signSessionToken } from "@/server/auth/jwt";
import {
  isValidEmailFormat,
  isValidIndianMobileNumber,
  normalizeEmail,
  normalizeMobileNumber,
} from "@/server/utils/auth-normalizers";
import {
  findPendingSignupByNormalizedEmail,
  findPendingSignupByNormalizedMobileNumber,
} from "@/server/repositories/signup-v2.repository";

export async function signupUser(input: {
  fullName: string;
  email: string;
  mobileNumber?: string;
  password: string;
}) {
  const existingUser = await findUserByEmail(input.email);

  if (existingUser) {
    throw new AppError("User already exists with this email", 409);
  }

  const passwordHash = await hashPassword(input.password);

  const user = await createUser({
    fullName: input.fullName,
    email: input.email,
    mobileNumber: input.mobileNumber,
    passwordHash,
  });

  const token = await signSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return { user, token };
}

function resolveLoginIdentifier(identifier: string) {
  const raw = identifier.trim();

  const normalizedMobileNumber = normalizeMobileNumber(raw);
  if (isValidIndianMobileNumber(normalizedMobileNumber)) {
    return {
      type: "mobile" as const,
      value: normalizedMobileNumber,
    };
  }

  const normalizedEmail = normalizeEmail(raw);
  if (isValidEmailFormat(normalizedEmail)) {
    return {
      type: "email" as const,
      value: normalizedEmail,
    };
  }

  throw new AppError("Enter a valid email or 10-digit mobile number", 422);
}

export async function loginUser(input: { identifier: string; password: string }) {
  const resolved = resolveLoginIdentifier(input.identifier);
  const now = Date.now();

  const pendingSignup =
    resolved.type === "email"
      ? await findPendingSignupByNormalizedEmail(resolved.value)
      : await findPendingSignupByNormalizedMobileNumber(resolved.value);

  if (pendingSignup && pendingSignup.expiresAt.getTime() > now) {
    throw new AppError(
      "Account not created yet. Complete email verification first.",
      409
    );
  }

  const user =
    resolved.type === "email"
      ? await findUserByEmail(resolved.value)
      : await findUserByMobileNumber(resolved.value);

  if (!user) {
    throw new AppError("Invalid email/mobile or password", 401);
  }

  const isPasswordValid = await comparePassword(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError("Invalid email/mobile or password", 401);
  }

  if (user.status === "BLOCKED") {
    throw new AppError("User account is blocked", 403);
  }

  const token = await signSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      preferredLanguage: user.preferredLanguage,
      emailVerified: user.emailVerified,
    },
  };
}

export async function getCurrentUser(userId: string) {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    preferredLanguage: user.preferredLanguage,
    emailVerified: user.emailVerified,
    status: user.status,
  };
}