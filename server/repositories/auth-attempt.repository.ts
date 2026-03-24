import { AuthAttemptStatus, AuthAttemptType } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

export async function countRecentAuthAttempts(input: {
  since: Date;
  types: AuthAttemptType[];
  statuses?: AuthAttemptStatus[];
  email?: string;
  mobileNumber?: string;
  ipAddress?: string;
}) {
  const orConditions: Array<Record<string, string>> = [];

  if (input.email) {
    orConditions.push({ email: input.email });
  }

  if (input.mobileNumber) {
    orConditions.push({ mobileNumber: input.mobileNumber });
  }

  if (input.ipAddress) {
    orConditions.push({ ipAddress: input.ipAddress });
  }

  if (!orConditions.length) {
    return 0;
  }

  return prisma.authAttempt.count({
    where: {
      createdAt: {
        gte: input.since,
      },
      type: {
        in: input.types,
      },
      ...(input.statuses?.length
        ? {
            status: {
              in: input.statuses,
            },
          }
        : {}),
      OR: orConditions,
    },
  });
}
