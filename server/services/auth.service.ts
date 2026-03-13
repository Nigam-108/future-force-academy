import { comparePassword, hashPassword } from "@/server/auth/password";
import { AppError } from "@/server/utils/errors";
import { createUser, findUserByEmail, findUserById } from "@/server/repositories/user.repository";
import { signSessionToken } from "@/server/auth/jwt";

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

export async function loginUser(input: { email: string; password: string }) {
  const user = await findUserByEmail(input.email);

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await comparePassword(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
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
