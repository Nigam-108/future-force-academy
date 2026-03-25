import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizeFullName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function splitLegacyFullName(fullName: string) {
  const normalized = normalizeFullName(fullName);

  if (!normalized) {
    return {
      firstName: "User",
      lastName: null as string | null,
      fullName: "User",
    };
  }

  const parts = normalized.split(" ");
  const firstName = parts[0] ?? "User";
  const lastName = parts.length > 1 ? parts.slice(1).join(" ") : null;

  return {
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(" ").trim(),
  };
}

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [{ firstName: null }, { firstName: "" }],
    },
    select: {
      id: true,
      fullName: true,
      firstName: true,
      lastName: true,
      email: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  let updatedCount = 0;

  for (const user of users) {
    const next = splitLegacyFullName(user.fullName);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: next.firstName,
        lastName: next.lastName,
        fullName: next.fullName,
      },
    });

    updatedCount += 1;
    console.log(`Updated ${user.email} -> ${next.fullName}`);
  }

  console.log(`Done. Updated ${updatedCount} user(s).`);
}

main()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });