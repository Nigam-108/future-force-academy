-- CreateEnum
CREATE TYPE "ContentVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PolicyType" AS ENUM ('TERMS', 'PRIVACY', 'REFUND_CANCELLATION');

-- CreateEnum
CREATE TYPE "AuthAttemptType" AS ENUM ('SIGNUP_AVAILABILITY', 'SIGNUP_START', 'SIGNUP_CONTINUE', 'SIGNUP_RESEND', 'SIGNUP_VERIFY', 'LOGIN', 'PASSWORD_RESET_REQUEST');

-- CreateEnum
CREATE TYPE "AuthAttemptStatus" AS ENUM ('SUCCESS', 'FAILED', 'BLOCKED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "marketingEmailsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "PolicyDocument" (
    "id" TEXT NOT NULL,
    "type" "PolicyType" NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "ContentVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "contentMarkdown" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignupSettingsVersion" (
    "id" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "ContentVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "settings" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignupSettingsVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingSignup" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "normalizedEmail" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "normalizedMobileNumber" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "marketingEmailsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "termsAcceptedAt" TIMESTAMP(3) NOT NULL,
    "privacyAcceptedAt" TIMESTAMP(3) NOT NULL,
    "refundPolicyAcceptedAt" TIMESTAMP(3) NOT NULL,
    "singleAccountConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "singleAccountConfirmedAt" TIMESTAMP(3),
    "signupSettingsVersionId" TEXT NOT NULL,
    "signupSettingsSnapshot" JSONB NOT NULL,
    "termsPolicyVersionId" TEXT NOT NULL,
    "privacyPolicyVersionId" TEXT NOT NULL,
    "refundPolicyVersionId" TEXT NOT NULL,
    "policyConsentSnapshot" JSONB NOT NULL,
    "otpHash" TEXT,
    "otpExpiresAt" TIMESTAMP(3),
    "otpLastSentAt" TIMESTAMP(3),
    "otpSendCount" INTEGER NOT NULL DEFAULT 0,
    "otpResendCount" INTEGER NOT NULL DEFAULT 0,
    "otpWindowStartedAt" TIMESTAMP(3),
    "wrongOtpCount" INTEGER NOT NULL DEFAULT 0,
    "verifyBlockedUntil" TIMESTAMP(3),
    "resendBlockedUntil" TIMESTAMP(3),
    "turnstileRequired" BOOLEAN NOT NULL DEFAULT false,
    "turnstileVerifiedAt" TIMESTAMP(3),
    "sourceContext" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingSignup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignupVerificationAudit" (
    "id" TEXT NOT NULL,
    "pendingSignupId" TEXT,
    "email" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "createdUserId" TEXT NOT NULL,
    "signupSettingsVersionId" TEXT,
    "policyConsentSnapshot" JSONB,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignupVerificationAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPolicyConsent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "policyVersionId" TEXT NOT NULL,
    "policyType" "PolicyType" NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceContext" TEXT,
    "snapshot" JSONB,

    CONSTRAINT "UserPolicyConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthAttempt" (
    "id" TEXT NOT NULL,
    "type" "AuthAttemptType" NOT NULL,
    "status" "AuthAttemptStatus" NOT NULL,
    "pendingSignupId" TEXT,
    "email" TEXT,
    "mobileNumber" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PolicyDocument_type_key" ON "PolicyDocument"("type");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyDocument_slug_key" ON "PolicyDocument"("slug");

-- CreateIndex
CREATE INDEX "PolicyVersion_documentId_status_idx" ON "PolicyVersion"("documentId", "status");

-- CreateIndex
CREATE INDEX "PolicyVersion_publishedAt_idx" ON "PolicyVersion"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyVersion_documentId_versionNumber_key" ON "PolicyVersion"("documentId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SignupSettingsVersion_versionNumber_key" ON "SignupSettingsVersion"("versionNumber");

-- CreateIndex
CREATE INDEX "SignupSettingsVersion_status_publishedAt_idx" ON "SignupSettingsVersion"("status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PendingSignup_normalizedEmail_key" ON "PendingSignup"("normalizedEmail");

-- CreateIndex
CREATE UNIQUE INDEX "PendingSignup_normalizedMobileNumber_key" ON "PendingSignup"("normalizedMobileNumber");

-- CreateIndex
CREATE INDEX "PendingSignup_normalizedEmail_idx" ON "PendingSignup"("normalizedEmail");

-- CreateIndex
CREATE INDEX "PendingSignup_normalizedMobileNumber_idx" ON "PendingSignup"("normalizedMobileNumber");

-- CreateIndex
CREATE INDEX "PendingSignup_expiresAt_idx" ON "PendingSignup"("expiresAt");

-- CreateIndex
CREATE INDEX "PendingSignup_resendBlockedUntil_idx" ON "PendingSignup"("resendBlockedUntil");

-- CreateIndex
CREATE INDEX "PendingSignup_verifyBlockedUntil_idx" ON "PendingSignup"("verifyBlockedUntil");

-- CreateIndex
CREATE INDEX "SignupVerificationAudit_createdUserId_idx" ON "SignupVerificationAudit"("createdUserId");

-- CreateIndex
CREATE INDEX "SignupVerificationAudit_email_idx" ON "SignupVerificationAudit"("email");

-- CreateIndex
CREATE INDEX "SignupVerificationAudit_verifiedAt_idx" ON "SignupVerificationAudit"("verifiedAt");

-- CreateIndex
CREATE INDEX "UserPolicyConsent_policyType_acceptedAt_idx" ON "UserPolicyConsent"("policyType", "acceptedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserPolicyConsent_userId_policyVersionId_key" ON "UserPolicyConsent"("userId", "policyVersionId");

-- CreateIndex
CREATE INDEX "AuthAttempt_type_createdAt_idx" ON "AuthAttempt"("type", "createdAt");

-- CreateIndex
CREATE INDEX "AuthAttempt_status_createdAt_idx" ON "AuthAttempt"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AuthAttempt_email_createdAt_idx" ON "AuthAttempt"("email", "createdAt");

-- CreateIndex
CREATE INDEX "AuthAttempt_mobileNumber_createdAt_idx" ON "AuthAttempt"("mobileNumber", "createdAt");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_expiresAt_idx" ON "PasswordResetToken"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "PasswordResetToken_tokenHash_idx" ON "PasswordResetToken"("tokenHash");

-- AddForeignKey
ALTER TABLE "PolicyVersion" ADD CONSTRAINT "PolicyVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "PolicyDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingSignup" ADD CONSTRAINT "PendingSignup_signupSettingsVersionId_fkey" FOREIGN KEY ("signupSettingsVersionId") REFERENCES "SignupSettingsVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingSignup" ADD CONSTRAINT "PendingSignup_termsPolicyVersionId_fkey" FOREIGN KEY ("termsPolicyVersionId") REFERENCES "PolicyVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingSignup" ADD CONSTRAINT "PendingSignup_privacyPolicyVersionId_fkey" FOREIGN KEY ("privacyPolicyVersionId") REFERENCES "PolicyVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingSignup" ADD CONSTRAINT "PendingSignup_refundPolicyVersionId_fkey" FOREIGN KEY ("refundPolicyVersionId") REFERENCES "PolicyVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignupVerificationAudit" ADD CONSTRAINT "SignupVerificationAudit_pendingSignupId_fkey" FOREIGN KEY ("pendingSignupId") REFERENCES "PendingSignup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignupVerificationAudit" ADD CONSTRAINT "SignupVerificationAudit_createdUserId_fkey" FOREIGN KEY ("createdUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignupVerificationAudit" ADD CONSTRAINT "SignupVerificationAudit_signupSettingsVersionId_fkey" FOREIGN KEY ("signupSettingsVersionId") REFERENCES "SignupSettingsVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPolicyConsent" ADD CONSTRAINT "UserPolicyConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPolicyConsent" ADD CONSTRAINT "UserPolicyConsent_policyVersionId_fkey" FOREIGN KEY ("policyVersionId") REFERENCES "PolicyVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthAttempt" ADD CONSTRAINT "AuthAttempt_pendingSignupId_fkey" FOREIGN KEY ("pendingSignupId") REFERENCES "PendingSignup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
