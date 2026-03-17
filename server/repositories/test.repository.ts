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

/**
 * Finds a test by slug.
 */
export async function findTestBySlug(slug: string) {
  return prisma.test.findUnique({
    where: { slug },
    include: testInclude,
  });
}

/**
 * Finds a test by id.
 */
export async function findTestById(id: string) {
  return prisma.test.findUnique({
    where: { id },
    include: testInclude,
  });
}

/**
 * Creates a new test.
 */
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

/**
 * Updates an existing test.
 */
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

/**
 * Lists admin-visible tests with pagination and filters.
 */
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
    ...(filters.structureType
      ? { structureType: filters.structureType }
      : {}),
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

/**
 * Lists student-visible tests.
 */
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

/**
 * Returns the delete-impact information for a test.
 */
export async function findTestDeleteImpact(id: string) {
  return prisma.test.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      _count: {
        select: {
          sections: true,
          testQuestions: true,
          attempts: true,
        },
      },
    },
  });
}

/**
 * Deletes a test.
 */
export async function deleteTestRecord(id: string) {
  return prisma.test.delete({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
    },
  });
}

/**
 * Fetches a full test blueprint for duplication.
 *
 * Includes:
 * - sections in proper order
 * - assigned questions in proper order
 *
 * Why:
 * duplicating a test should preserve its structure and assignment setup.
 */
export async function findTestBlueprintForDuplication(id: string) {
  return prisma.test.findUnique({
    where: { id },
    include: {
      sections: {
        orderBy: {
          displayOrder: "asc",
        },
      },
      testQuestions: {
        orderBy: {
          displayOrder: "asc",
        },
      },
    },
  });
}

/**
 * Creates a duplicated test with copied sections and assigned rows.
 *
 * Important duplication rules:
 * - new test is always created as DRAFT
 * - attempts/results are NOT copied
 * - sections are recreated first
 * - testQuestions are recreated after section-id remapping
 */
export async function duplicateTestRecord(params: {
  sourceTest: NonNullable<Awaited<ReturnType<typeof findTestBlueprintForDuplication>>>;
  newTitle: string;
  newSlug: string;
  createdById: string;
}) {
  return prisma.$transaction(async (tx) => {
    const source = params.sourceTest;

    const createdTest = await tx.test.create({
      data: {
        createdById: params.createdById,
        title: params.newTitle,
        slug: params.newSlug,
        description: source.description ?? undefined,
        mode: source.mode,
        structureType: source.structureType,
        visibilityStatus: TestVisibilityStatus.DRAFT,
        totalQuestions: source.totalQuestions,
        totalMarks: source.totalMarks,
        durationInMinutes: source.durationInMinutes ?? undefined,
        startAt: source.startAt ?? undefined,
        endAt: source.endAt ?? undefined,
      },
    });

    /**
     * Recreate sections and map old sectionId -> new sectionId.
     */
    const sectionIdMap = new Map<string, string>();

    for (const section of source.sections) {
      const createdSection = await tx.testSection.create({
        data: {
          testId: createdTest.id,
          title: section.title,
          displayOrder: section.displayOrder,
          totalQuestions: section.totalQuestions,
          durationInMinutes: section.durationInMinutes,
          positiveMarks: section.positiveMarks,
          negativeMarks: section.negativeMarks,
        },
      });

      sectionIdMap.set(section.id, createdSection.id);
    }

    /**
     * Recreate assigned test-question rows with mapped section ids.
     */
    if (source.testQuestions.length > 0) {
      await tx.testQuestion.createMany({
        data: source.testQuestions.map((item) => ({
          testId: createdTest.id,
          questionId: item.questionId,
          sectionId: item.sectionId ? sectionIdMap.get(item.sectionId) ?? null : null,
          displayOrder: item.displayOrder,
          positiveMarks: item.positiveMarks,
          negativeMarks: item.negativeMarks,
        })),
      });
    }

    return tx.test.findUnique({
      where: { id: createdTest.id },
      include: testInclude,
    });
  });
}