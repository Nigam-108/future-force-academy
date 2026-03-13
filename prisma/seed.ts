import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
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

  console.log("Seed completed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
