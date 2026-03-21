import {
  Prisma,
  TestMode,
  TestStructureType,
  TestVisibilityStatus,
} from "@prisma/client";
import { prisma } from "@/server/db/prisma";

/**
 * Admin-facing include — includes testBatches for assignment display.
 */
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
      displayOrder: "asc" as const,
    },
  },
  _count: {
    select: {
      testQuestions: true,
      attempts: true,
    },
  },
  testBatches: {
    select: {
      id: true,
      batch: {
        select: {
          id: true,
          title: true,
          slug: true,
          examType: true,
          status: true,
          isPaid: true,
          color: true,
        },
      },
    },
    orderBy: {
      assignedAt: "asc" as const,
    },
  },
} satisfies Prisma.TestInclude;

/**
 * Student-facing include — excludes testBatches from response.
 * Batch filtering is done in the WHERE clause, not exposed to students.
 */
const studentTestInclude = {
  sections: {
    orderBy: { displayOrder: "asc" as const },
  },
  _count: {
    select: {
      testQuestions: true,
      testBatches: true,
    },
  },
  testBatches: {
    select: {
      batchId: true,
      batch: {
        select: {
          id: true,
          title: true,
          color: true,
        },
      },
    },
    orderBy: { assignedAt: "asc" as const },
    take: 3,
  },
};


export async function findTestBySlug(slug: string) {
  return prisma.test.findUnique({
    where: { slug },
    include: testInclude,
  });
}

export async function findTestById(id: string) {
  return prisma.test.findUnique({
    where: { id },
    include: testInclude,
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

export async function listTestRecords(filters: {
  page: number;
  limit: number;
  search?: string;
  mode?: TestMode;
  structureType?: TestStructureType;
  visibilityStatus?: TestVisibilityStatus;
  batchId?: string;
}) {
  const where: Prisma.TestWhereInput = {
    ...(filters.search
      ? {
          OR: [
            { title: { contains: filters.search, mode: "insensitive" } },
            { slug: { contains: filters.search, mode: "insensitive" } },
            { description: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters.mode ? { mode: filters.mode } : {}),
    ...(filters.structureType ? { structureType: filters.structureType } : {}),
    ...(filters.visibilityStatus
      ? { visibilityStatus: filters.visibilityStatus }
      : {}),
    // Filter by batch — show only tests linked to this batch
    ...(filters.batchId
      ? {
          testBatches: {
            some: { batchId: filters.batchId },
          },
        }
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
 * Batch-aware student test listing.
 *
 * Visibility rule:
 * - No TestBatch rows = global test, all students see it
 * - TestBatch rows exist = student must have access via EITHER:
 *   a) StudentBatch record (admin assigned)
 *   b) Active Purchase record (paid/enrolled)
 */
/**
 * Batch-aware student test listing.
 *
 * A student sees a test if ANY of these 5 conditions are true:
 *   1. Test has no batch links (global)
 *   2. Student has full batch access via StudentBatch
 *   3. Student has full batch access via FULL_BATCH Purchase
 *   4. Student has a TestPurchase for this specific test
 *   5. Test is free (price=null/0) in a batch where student has
 *      individual TestPurchase records
 */
export async function listStudentVisibleTestRecords(filters: {
  page: number;
  limit: number;
  search?: string;
  mode?: TestMode;
  userId: string;
}) {
  const batchAccessFilter: Prisma.TestWhereInput = {
    OR: [
      // 1. Global test — no batch restrictions
      { testBatches: { none: {} } },

      // 2. Full batch access via StudentBatch (admin assigned)
      {
        testBatches: {
          some: {
            batch: {
              studentBatches: {
                some: { studentId: filters.userId },
              },
            },
          },
        },
      },

      // 3. Full batch access via FULL_BATCH Purchase
      {
        testBatches: {
          some: {
            batch: {
              purchases: {
                some: {
                  userId: filters.userId,
                  status: "ACTIVE",
                  purchaseType: "FULL_BATCH",
                },
              },
            },
          },
        },
      },

      // 4. Individual test purchase (TestPurchase record for this test)
      {
        testPurchases: {
          some: {
            userId: filters.userId,
            status: "ACTIVE",
          },
        },
      },

      // 5. Free test (price=null/0 in TestBatch) in a batch where student
      //    has any individual TestPurchase (gives access to free tests
      //    alongside paid tests they bought)
      {
        testBatches: {
          some: {
            AND: [
              { OR: [{ price: null }, { price: 0 }] },
              {
                batch: {
                  testPurchases: {
                    some: {
                      userId: filters.userId,
                      status: "ACTIVE",
                    },
                  },
                },
              },
            ],
          },
        },
      },
    ],
  };

  const where: Prisma.TestWhereInput = {
    AND: [
      { visibilityStatus: TestVisibilityStatus.LIVE },
      batchAccessFilter,
      ...(filters.search
        ? [
            {
              OR: [
                {
                  title: {
                    contains: filters.search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  slug: {
                    contains: filters.search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  description: {
                    contains: filters.search,
                    mode: "insensitive" as const,
                  },
                },
              ],
            },
          ]
        : []),
      ...(filters.mode ? [{ mode: filters.mode }] : []),
    ],
  };

  const skip = (filters.page - 1) * filters.limit;

  const [items, total] = await Promise.all([
    prisma.test.findMany({
      where,
      skip,
      take: filters.limit,
      orderBy: { createdAt: "desc" },
      include: studentTestInclude,
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

export async function deleteTestRecord(id: string) {
  return prisma.test.delete({
    where: { id },
    select: { id: true, title: true, slug: true },
  });
}

// ─── Blueprint type defined FIRST so duplicateTestRecord can reference it ───

type TestBlueprint = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  mode: TestMode;
  structureType: TestStructureType;
  visibilityStatus: TestVisibilityStatus;
  totalQuestions: number;
  totalMarks: number;
  durationInMinutes: number | null;
  startAt: Date | null;
  endAt: Date | null;
  sections: Array<{
    id: string;
    title: string;
    displayOrder: number;
    totalQuestions: number;
    durationInMinutes: number | null;
    positiveMarks: number | null;
    negativeMarks: number | null;
  }>;
  testQuestions: Array<{
    id: string;
    questionId: string;
    sectionId: string | null;
    displayOrder: number;
    positiveMarks: number | null;
    negativeMarks: number | null;
  }>;
};

export async function findTestBlueprintForDuplication(
  id: string
): Promise<TestBlueprint | null> {
  return prisma.test.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      mode: true,
      structureType: true,
      visibilityStatus: true,
      totalQuestions: true,
      totalMarks: true,
      durationInMinutes: true,
      startAt: true,
      endAt: true,
      sections: {
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
          title: true,
          displayOrder: true,
          totalQuestions: true,
          durationInMinutes: true,
          positiveMarks: true,
          negativeMarks: true,
        },
      },
      testQuestions: {
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
          questionId: true,
          sectionId: true,
          displayOrder: true,
          positiveMarks: true,
          negativeMarks: true,
        },
      },
    },
  });
}

export async function duplicateTestRecord(params: {
  sourceTest: TestBlueprint;
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

    if (source.testQuestions.length > 0) {
      await tx.testQuestion.createMany({
        data: source.testQuestions.map((item) => ({
          testId: createdTest.id,
          questionId: item.questionId,
          sectionId: item.sectionId
            ? sectionIdMap.get(item.sectionId) ?? null
            : null,
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