import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── All 12 permission keys ────────────────────────────────────────────────
// ADMIN role gets all of them granted by default
// SUB_ADMIN gets only the safe read/limited ones by default
// Admin can override per-user via the permissions page (6C batch)
const PERMISSIONS = [
  { key: "question.manage",     label: "Manage Questions",    description: "Create, edit, delete, import questions" },
  { key: "test.manage",         label: "Manage Tests",        description: "Create, edit, delete, duplicate tests and assign questions" },
  { key: "batch.manage",        label: "Manage Batches",      description: "Create, edit, delete batches and assign students" },
  { key: "student.manage",      label: "Manage Students",     description: "View, block, unblock students and manage batch assignments" },
  { key: "payment.manage",      label: "Manage Payments",     description: "View payments, reconcile, manual enroll, update status" },
  { key: "coupon.manage",       label: "Manage Coupons",      description: "Create, edit, toggle coupons" },
  { key: "report.view",         label: "View Reports",        description: "Access platform reports and attempt analytics" },
  { key: "revenue.view",        label: "View Revenue",        description: "Access revenue dashboard and pricing stats" },
  { key: "announcement.manage", label: "Manage Announcements",description: "Create, edit, publish announcements" },
  { key: "category.manage",     label: "Manage Categories",   description: "Create and edit exam categories" },
  { key: "permission.manage",   label: "Manage Permissions",  description: "Grant or revoke permissions for sub-admins" },
  { key: "activity.view",       label: "View Activity Logs",  description: "View admin activity logs" },
];

// SUB_ADMIN default permissions — safe read + limited manage
// Does NOT include: payment.manage, permission.manage, revenue.view by default
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

async function main() {
  // ── Seed admin user ────────────────────────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);

  await prisma.user.upsert({
    where: { email: "admin@futureforceacademy.com" },
    update: {},
    create: {
      fullName: "Main Admin",
      email: "admin@futureforceacademy.com",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      emailVerified: true,
    },
  });

  // ── Seed all 12 permissions ────────────────────────────────────────────────
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: { label: perm.label, description: perm.description },
      create: perm,
    });
  }

  // ── Seed ADMIN role — gets ALL permissions ─────────────────────────────────
  for (const perm of PERMISSIONS) {
    const permRecord = await prisma.permission.findUnique({ where: { key: perm.key } });
    if (!permRecord) continue;

    await prisma.rolePermission.upsert({
      where: { role_permissionId: { role: UserRole.ADMIN, permissionId: permRecord.id } },
      update: { granted: true },
      create: { role: UserRole.ADMIN, permissionId: permRecord.id, granted: true },
    });
  }

  // ── Seed SUB_ADMIN role — gets limited default permissions ─────────────────
  for (const perm of PERMISSIONS) {
    const permRecord = await prisma.permission.findUnique({ where: { key: perm.key } });
    if (!permRecord) continue;

    const granted = SUB_ADMIN_DEFAULT_KEYS.includes(perm.key);

    await prisma.rolePermission.upsert({
      where: { role_permissionId: { role: UserRole.SUB_ADMIN, permissionId: permRecord.id } },
      update: { granted },
      create: { role: UserRole.SUB_ADMIN, permissionId: permRecord.id, granted },
    });
  }

  console.log("✅ Seed completed — admin user + 12 permissions seeded");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });