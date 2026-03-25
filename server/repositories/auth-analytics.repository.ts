import { AuthEventType, Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

export type CreateAuthEventInput = {
  eventType: AuthEventType;
  email?: string | null;
  mobileNumber?: string | null;
  userId?: string | null;
  sessionId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
};

export async function createAuthEvent(input: CreateAuthEventInput) {
  return prisma.authEvent.create({
    data: {
      eventType: input.eventType,
      email: input.email ?? undefined,
      mobileNumber: input.mobileNumber ?? undefined,
      userId: input.userId ?? undefined,
      sessionId: input.sessionId ?? undefined,
      ipAddress: input.ipAddress ?? undefined,
      userAgent: input.userAgent ?? undefined,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function getAuthInsights(days: number) {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const events = await prisma.authEvent.findMany({
    where: {
      createdAt: {
        gte: fromDate,
      },
    },
    select: {
      id: true,
      eventType: true,
      email: true,
      mobileNumber: true,
      userId: true,
      ipAddress: true,
      userAgent: true,
      metadata: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const counts = Object.values(AuthEventType).reduce<Record<string, number>>(
    (acc, key) => {
      acc[key] = 0;
      return acc;
    },
    {}
  );

  for (const event of events) {
    counts[event.eventType] = (counts[event.eventType] ?? 0) + 1;
  }

  const signupStarts = counts.SIGNUP_STARTED ?? 0;
  const otpVerified = counts.OTP_VERIFIED ?? 0;
  const signupCompleted = counts.SIGNUP_COMPLETED ?? 0;
  const loginSuccess = counts.LOGIN_SUCCESS ?? 0;
  const loginFailed = counts.LOGIN_FAILED ?? 0;
  const otpFailed = counts.SIGNUP_FAILED ?? 0;

  return {
    days,
    fromDate,
    summary: {
      signupStarts,
      otpVerified,
      signupCompleted,
      loginSuccess,
      loginFailed,
      otpFailed,
      signupConversionRate:
        signupStarts > 0
          ? Number(((signupCompleted / signupStarts) * 100).toFixed(2))
          : 0,
      otpSuccessRate:
        signupStarts > 0
          ? Number(((otpVerified / signupStarts) * 100).toFixed(2))
          : 0,
      loginFailureRate:
        loginSuccess + loginFailed > 0
          ? Number(
              ((loginFailed / (loginSuccess + loginFailed)) * 100).toFixed(2)
            )
          : 0,
    },
    recentEvents: events.slice(0, 50),
  };
}