import { prisma } from "@/server/db/prisma";

export async function findLatestActivePasswordResetToken(userId: string) {
  return prisma.passwordResetToken.findFirst({
    where: {
      userId,
      usedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function invalidateActivePasswordResetTokens(userId: string) {
  return prisma.passwordResetToken.updateMany({
    where: {
      userId,
      usedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    data: {
      usedAt: new Date(),
    },
  });
}

export async function createPasswordResetToken(data: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  return prisma.passwordResetToken.create({
    data,
  });
}

export async function findValidPasswordResetTokenByHash(userId: string, tokenHash: string) {
  return prisma.passwordResetToken.findFirst({
    where: {
      userId,
      tokenHash,
      usedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function markPasswordResetTokenUsed(id: string) {
  return prisma.passwordResetToken.update({
    where: { id },
    data: {
      usedAt: new Date(),
    },
  });
}