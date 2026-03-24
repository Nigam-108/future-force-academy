import { PrismaClient, UserRole, PolicyType, ContentVersionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PERMISSIONS = [
  { key: "question.manage", label: "Manage Questions", description: "Create, edit, delete, import questions" },
  { key: "test.manage", label: "Manage Tests", description: "Create, edit, delete, duplicate tests and assign questions" },
  { key: "batch.manage", label: "Manage Batches", description: "Create, edit, delete batches and assign students" },
  { key: "student.manage", label: "Manage Students", description: "View, block, unblock students and manage batch assignments" },
  { key: "payment.manage", label: "Manage Payments", description: "View payments, reconcile, manual enroll, update status" },
  { key: "coupon.manage", label: "Manage Coupons", description: "Create, edit, toggle coupons" },
  { key: "report.view", label: "View Reports", description: "Access platform reports and attempt analytics" },
  { key: "revenue.view", label: "View Revenue", description: "Access revenue dashboard and pricing stats" },
  { key: "announcement.manage", label: "Manage Announcements", description: "Create, edit, publish announcements" },
  { key: "category.manage", label: "Manage Categories", description: "Create and edit exam categories" },
  { key: "permission.manage", label: "Manage Permissions", description: "Grant or revoke permissions for sub-admins" },
  { key: "activity.view", label: "View Activity Logs", description: "View admin activity logs" },
];

const SUB_ADMIN_DEFAULT_KEYS = [
  "question.manage",
  "test.manage",
  "batch.manage",
  "student.manage",
  "report.view",
  "announcement.manage",
  "category.manage",
  "activity.view",
];

const DEFAULT_SIGNUP_SETTINGS = {
  otpLength: 4,
  otpExpiryMinutes: 10,
  resendCooldownSeconds: 60,
  resendLimit: 5,
  resendWindowMinutes: 15,
  resendBlockMinutes: 30,
  wrongAttemptLimit: 5,
  wrongAttemptBlockMinutes: 5,
  pendingLifetimeHours: 24,
  allowEmailOtpOnly: true,
  requireMobileNumber: true,
  loginIdentifierMode: "EMAIL_OR_MOBILE",
  marketingEmailsOptInDefault: true,
  turnstileSuspiciousAttemptThreshold: 3,
};

async function seedPolicyDocument(params: {
  type: PolicyType;
  slug: string;
  title: string;
  summary: string;
  contentMarkdown: string;
}) {
  const document = await prisma.policyDocument.upsert({
    where: { type: params.type },
    update: {
      slug: params.slug,
      title: params.title,
      description: params.summary,
    },
    create: {
      type: params.type,
      slug: params.slug,
      title: params.title,
      description: params.summary,
    },
  });

  await prisma.policyVersion.upsert({
    where: {
      documentId_versionNumber: {
        documentId: document.id,
        versionNumber: 1,
      },
    },
    update: {
      status: ContentVersionStatus.PUBLISHED,
      title: params.title,
      summary: params.summary,
      contentMarkdown: params.contentMarkdown,
      publishedAt: new Date(),
    },
    create: {
      documentId: document.id,
      versionNumber: 1,
      status: ContentVersionStatus.PUBLISHED,
      title: params.title,
      summary: params.summary,
      contentMarkdown: params.contentMarkdown,
      publishedAt: new Date(),
    },
  });
}

async function main() {
  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);

  await prisma.user.upsert({
    where: { email: "admin@futureforceacademy.com" },
    update: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      marketingEmailsEnabled: true,
    },
    create: {
      fullName: "Main Admin",
      email: "admin@futureforceacademy.com",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      marketingEmailsEnabled: true,
    },
  });

  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: { label: perm.label, description: perm.description },
      create: perm,
    });
  }

  for (const perm of PERMISSIONS) {
    const permRecord = await prisma.permission.findUnique({ where: { key: perm.key } });
    if (!permRecord) continue;

    await prisma.rolePermission.upsert({
      where: {
        role_permissionId: {
          role: UserRole.ADMIN,
          permissionId: permRecord.id,
        },
      },
      update: { granted: true },
      create: {
        role: UserRole.ADMIN,
        permissionId: permRecord.id,
        granted: true,
      },
    });
  }

  for (const perm of PERMISSIONS) {
    const permRecord = await prisma.permission.findUnique({ where: { key: perm.key } });
    if (!permRecord) continue;

    const granted = SUB_ADMIN_DEFAULT_KEYS.includes(perm.key);

    await prisma.rolePermission.upsert({
      where: {
        role_permissionId: {
          role: UserRole.SUB_ADMIN,
          permissionId: permRecord.id,
        },
      },
      update: { granted },
      create: {
        role: UserRole.SUB_ADMIN,
        permissionId: permRecord.id,
        granted,
      },
    });
  }

  await seedPolicyDocument({
    type: PolicyType.TERMS,
    slug: "terms-and-conditions",
    title: "Terms & Conditions",
    summary: "Default launch version for signup consent and account usage.",
    contentMarkdown: `# Terms & Conditions

By creating an account with Future Force Academy, the user agrees to use the platform lawfully, maintain accurate account details, and keep credentials secure.

## One-account rule
Only one account is allowed per email and mobile number.

## Important system emails
Even if the user turns off optional promotional or future update emails, the platform may still send important system emails such as OTPs, security notices, policy updates, and essential account notices.
`,
  });

  await seedPolicyDocument({
    type: PolicyType.PRIVACY,
    slug: "privacy-policy",
    title: "Privacy Policy",
    summary: "Default launch version for signup consent and personal-data use.",
    contentMarkdown: `# Privacy Policy

Future Force Academy collects and processes limited account data such as name, email, mobile number, and security-related verification data for account creation, authentication, and service delivery.

## Verification data
For security and audit purposes, the platform may store OTP-related metadata, IP address, and user-agent/device information.

## Important system emails
Users may still receive essential account and security emails even if optional update emails are disabled.
`,
  });

  await seedPolicyDocument({
    type: PolicyType.REFUND_CANCELLATION,
    slug: "refund-cancellation-policy",
    title: "Refund / Cancellation Policy",
    summary: "Default launch version for signup consent and purchase-policy reference.",
    contentMarkdown: `# Refund / Cancellation Policy

This is the default published refund and cancellation policy for the launch phase.

Specific refund eligibility, timelines, and cancellation conditions may depend on the product, batch, or test series purchased, and may be updated through future published versions.
`,
  });

  await prisma.signupSettingsVersion.upsert({
    where: { versionNumber: 1 },
    update: {
      status: ContentVersionStatus.PUBLISHED,
      title: "Launch Signup Rules",
      summary: "Default signup rules for student account creation with email OTP verification.",
      settings: DEFAULT_SIGNUP_SETTINGS,
      publishedAt: new Date(),
    },
    create: {
      versionNumber: 1,
      status: ContentVersionStatus.PUBLISHED,
      title: "Launch Signup Rules",
      summary: "Default signup rules for student account creation with email OTP verification.",
      settings: DEFAULT_SIGNUP_SETTINGS,
      publishedAt: new Date(),
    },
  });

  console.log("✅ Seed completed — admin, permissions, policies, and signup settings seeded");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });