import { UserRole, UserStatus } from "@prisma/client";
import { comparePassword, hashPassword } from "@/server/auth/password";
import { signSessionToken } from "@/server/auth/jwt";
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByMobileNumber,
} from "@/server/repositories/user.repository";
import {
  findPendingSignupByNormalizedEmail,
  findPendingSignupByNormalizedMobileNumber,
} from "@/server/repositories/signup-v2.repository";
import {
  isValidEmailFormat,
  isValidIndianMobileNumber,
  normalizeEmail,
  normalizeMobileNumber,
} from "@/server/utils/auth-normalizers";
import { buildDisplayName, resolveDisplayName } from "@/server/utils/name";
import { AppError } from "@/server/utils/errors";

async function resolveLoginIdentifier(identifier: string) {
  const trimmed = identifier.trim();

  if (!trimmed) {
    throw new AppError("Email or mobile number is required", 400);
  }

  if (isValidEmailFormat(trimmed)) {
    const email = normalizeEmail(trimmed);

    const [user, pendingSignup] = await Promise.all([
      findUserByEmail(email),
      findPendingSignupByNormalizedEmail(email),
    ]);

    return {
      identifierType: "email" as const,
      normalizedIdentifier: email,
      user,
      pendingSignup,
    };
  }

  if (isValidIndianMobileNumber(trimmed)) {
    const mobileNumber = normalizeMobileNumber(trimmed);

    const [user, pendingSignup] = await Promise.all([
      findUserByMobileNumber(mobileNumber),
      findPendingSignupByNormalizedMobileNumber(mobileNumber),
    ]);

    return {
      identifierType: "mobileNumber" as const,
      normalizedIdentifier: mobileNumber,
      user,
      pendingSignup,
    };
  }

  throw new AppError("Enter a valid email address or 10-digit mobile number", 400);
}

function buildUserResponse(user: {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  email: string;
  role: UserRole;
  preferredLanguage: string;
  emailVerified: boolean;
}) {
  return {
    id: user.id,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    fullName: user.fullName ?? resolveDisplayName(user),
    displayName: resolveDisplayName(user),
    email: user.email,
    role: user.role,
    preferredLanguage: user.preferredLanguage,
    emailVerified: user.emailVerified,
  };
}

export async function signupUser(input: {
  firstName: string;
  lastName?: string | null;
  email: string;
  mobileNumber?: string;
  password: string;
}) {
  const firstName = input.firstName.trim();
  const lastName = input.lastName?.trim() ? input.lastName.trim() : null;
  const email = normalizeEmail(input.email);
  const mobileNumber = input.mobileNumber?.trim()
    ? normalizeMobileNumber(input.mobileNumber)
    : undefined;

  if (!firstName) {
    throw new AppError("First name is required", 422);
  }

  const [existingEmailUser, existingMobileUser] = await Promise.all([
    findUserByEmail(email),
    mobileNumber ? findUserByMobileNumber(mobileNumber) : Promise.resolve(null),
  ]);

  if (existingEmailUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  if (existingMobileUser) {
    throw new AppError("An account with this mobile number already exists", 409);
  }

  const passwordHash = await hashPassword(input.password);
  const fullName = buildDisplayName(firstName, lastName);

  const user = await createUser({
    firstName,
    lastName,
    fullName,
    email,
    mobileNumber,
    passwordHash,
  });

  const token = await signSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: buildUserResponse(user),
    token,
  };
}

export async function loginUser(input: {
  identifier: string;
  password: string;
}) {
  const { user, pendingSignup } = await resolveLoginIdentifier(input.identifier);

  if (!user) {
    if (pendingSignup) {
      throw new AppError(
        "Account not created yet. Complete email verification first.",
        403
      );
    }

    throw new AppError("Invalid credentials", 401);
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new AppError("Your account is blocked. Please contact admin.", 403);
  }

  const isPasswordValid = await comparePassword(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError("Invalid credentials", 401);
  }

  const token = await signSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: buildUserResponse(user),
    token,
  };
}

export async function getCurrentUser(userId: string) {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return buildUserResponse(user);
}