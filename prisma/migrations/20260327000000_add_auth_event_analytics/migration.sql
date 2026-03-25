CREATE TYPE "AuthEventType" AS ENUM (
  'SIGNUP_STARTED',
  'OTP_SENT',
  'OTP_RESENT',
  'OTP_VERIFIED',
  'SIGNUP_COMPLETED',
  'SIGNUP_FAILED',
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'FORGOT_PASSWORD_REQUESTED',
  'POLICY_ACKNOWLEDGED'
);

CREATE TABLE "AuthEvent" (
  "id" TEXT NOT NULL,
  "eventType" "AuthEventType" NOT NULL,
  "email" TEXT,
  "mobileNumber" TEXT,
  "userId" TEXT,
  "sessionId" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuthEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuthEvent_eventType_createdAt_idx" ON "AuthEvent"("eventType", "createdAt");
CREATE INDEX "AuthEvent_email_idx" ON "AuthEvent"("email");
CREATE INDEX "AuthEvent_mobileNumber_idx" ON "AuthEvent"("mobileNumber");
CREATE INDEX "AuthEvent_userId_idx" ON "AuthEvent"("userId");
CREATE INDEX "AuthEvent_createdAt_idx" ON "AuthEvent"("createdAt");

ALTER TABLE "AuthEvent"
ADD CONSTRAINT "AuthEvent_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;