import { prisma } from "@/server/db/prisma";

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function createUser(data: {
  fullName: string;
  email: string;
  mobileNumber?: string;
  passwordHash: string;
}) {
  return prisma.user.create({
    data,
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
      preferredLanguage: true,
      emailVerified: true,
      createdAt: true,
    },
  });
}
