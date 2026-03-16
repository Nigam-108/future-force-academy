import {
  Prisma,
  TestMode,
  TestStructureType,
  TestVisibilityStatus,
} from "@prisma/client";
import { prisma } from "@/server/db/prisma";

const testInclude = {
  createdBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
  sections: {
    orderBy: {
      displayOrder: "asc",
    },
  },
  _count: {
    select: {
      testQuestions: true,
      attempts: true,
    },
  },
} satisfies Prisma.TestInclude;

export async function findTestBySlug(slug: string) {
  return prisma.test.findUnique({
    where: { slug },
  });
}

export async function createTestRecord(data: {
  createdById: string;
  title: string;
  slug: string;
  description?: string;
  mode: TestMode;
  structureType: TestStructureType;
  visibilityStatus: TestVisibilityStatus;
  totalQuestions: number;
  totalMarks: number;
  durationInMinutes?: number;
  startAt?: Date;
  endAt?: Date;
}) {
  return prisma.test.create({
    data,
    include: testInclude,
  });
}

export async function listTestRecords(filters: {
  page: number;
  limit: number;
  search?: string;
  mode?: TestMode;
  structureType?: TestStructureType;
  visibilityStatus?: TestVisibilityStatus;
}) {
  const where: Prisma.TestWhereInput = {
    ...(filters.search
      ? {
          OR: [
            {
              title: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
            {
              slug: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
    ...(filters.mode ? { mode: filters.mode } : {}),
    ...(filters.structureType ? { structureType: filters.structureType } : {}),
    ...(filters.visibilityStatus
      ? { visibilityStatus: filters.visibilityStatus }
      : {}),
  };

  const skip = (filters.page - 1) * filters.limit;

  const [items, total] = await Promise.all([
    prisma.test.findMany({
      where,
      skip,
      take: filters.limit,
      orderBy: { createdAt: "desc" },
      include: testInclude,
    }),
    prisma.test.count({ where }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  };
}

export async function findTestById(id: string) {
  return prisma.test.findUnique({
    where: { id },
    include: testInclude,
  });
}

export async function updateTestRecord(
  id: string,
  data: {
    title: string;
    slug: string;
    description?: string;
    mode: TestMode;
    structureType: TestStructureType;
    visibilityStatus: TestVisibilityStatus;
    totalQuestions: number;
    totalMarks: number;
    durationInMinutes?: number;
    startAt?: Date;
    endAt?: Date;
  }
) {
  return prisma.test.update({
    where: { id },
    data,
    include: testInclude,
  });
}

export async function listStudentVisibleTestRecords(filters: {
  page: number;
  limit: number;
  search?: string;
  mode?: TestMode;
}) {
  const where: Prisma.TestWhereInput = {
    visibilityStatus: TestVisibilityStatus.LIVE,
    ...(filters.search
      ? {
          OR: [
            {
              title: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
            {
              slug: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
    ...(filters.mode ? { mode: filters.mode } : {}),
  };

  const skip = (filters.page - 1) * filters.limit;

  const [items, total] = await Promise.all([
    prisma.test.findMany({
      where,
      skip,
      take: filters.limit,
      orderBy: [{ startAt: "asc" }, { createdAt: "desc" }],
      include: {
        sections: {
          orderBy: { displayOrder: "asc" },
        },
        _count: {
          select: {
            testQuestions: true,
            attempts: true,
          },
        },
      },
    }),
    prisma.test.count({ where }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  };
}