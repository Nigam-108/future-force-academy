import { prisma } from "@/server/db/prisma";

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function findUserByMobileNumber(mobileNumber: string) {
  return prisma.user.findFirst({
    where: { mobileNumber },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function createUser(data: {
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  mobileNumber?: string;
  passwordHash: string;
}) {
  return prisma.user.create({
    data,
    select: {
      id: true,
      fullName: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      status: true,
      preferredLanguage: true,
      emailVerified: true,
      createdAt: true,
    },
  });
}

export async function updateUserPassword(
  userId: string,
  passwordHash: string
) {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}