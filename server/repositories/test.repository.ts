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

const studentTestInclude = {
  sections: {
    orderBy: {
      displayOrder: "asc" as const,
    },
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
    orderBy: {
      assignedAt: "asc" as const,
    },
    take: 3,
  },
};

type SectionInput = {
  title: string;
  displayOrder: number;
  durationInMinutes?: number;
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
  allowSectionSwitching?: boolean;
  startAt?: Date;
  endAt?: Date;
  sections?: SectionInput[];
}) {
  return prisma.$transaction(async (tx) => {
    const createdTest = await tx.test.create({
      data: {
        createdById: data.createdById,
        title: data.title,
        slug: data.slug,
        description: data.description,
        mode: data.mode,
        structureType: data.structureType,
        visibilityStatus: data.visibilityStatus,
        totalQuestions: data.totalQuestions,
        totalMarks: data.totalMarks,
        durationInMinutes: data.durationInMinutes,
        allowSectionSwitching: data.allowSectionSwitching ?? false,
        startAt: data.startAt,
        endAt: data.endAt,
      },
    });

    if (data.structureType === "SECTIONAL" && data.sections?.length) {
      await tx.testSection.createMany({
        data: data.sections.map((section) => ({
          testId: createdTest.id,
          title: section.title,
          displayOrder: section.displayOrder,
          durationInMinutes: section.durationInMinutes,
        })),
      });
    }

    return tx.test.findUnique({
      where: { id: createdTest.id },
      include: testInclude,
    });
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
    allowSectionSwitching?: boolean; 
    startAt?: Date;
    endAt?: Date;
    sections?: SectionInput[];
  }
) {
  return prisma.$transaction(async (tx) => {
    await tx.test.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        mode: data.mode,
        structureType: data.structureType,
        visibilityStatus: data.visibilityStatus,
        totalQuestions: data.totalQuestions,
        totalMarks: data.totalMarks,
        durationInMinutes: data.durationInMinutes,
        allowSectionSwitching: data.allowSectionSwitching ?? false,
        startAt: data.startAt,
        endAt: data.endAt,
      },
    });

    await tx.testSection.deleteMany({
      where: { testId: id },
    });

    if (data.structureType === "SECTIONAL" && data.sections?.length) {
      await tx.testSection.createMany({
        data: data.sections.map((section) => ({
          testId: id,
          title: section.title,
          displayOrder: section.displayOrder,
          durationInMinutes: section.durationInMinutes,
        })),
      });
    }

    return tx.test.findUnique({
      where: { id },
      include: testInclude,
    });
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
    ...(filters.batchId
      ? {
          testBatches: {
            some: {
              batchId: filters.batchId,
            },
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

export async function listStudentVisibleTestRecords(filters: {
  page: number;
  limit: number;
  search?: string;
  mode?: TestMode;
  batchId?: string;
  userId: string;
}) {
    const batchAccessFilter: Prisma.TestWhereInput = {
    OR: [
      { testBatches: { none: {} } },
      {
        testBatches: {
          some: {
            batch: {
              isPaid: false,
              status: "ACTIVE",
            },
          },
        },
      },
      {
        testBatches: {
          some: {
            batch: {
              studentBatches: {
                some: {
                  studentId: filters.userId,
                },
              },
            },
          },
        },
      },
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
      {
        testPurchases: {
          some: {
            userId: filters.userId,
            status: "ACTIVE",
          },
        },
      },
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
      ...(filters.batchId
        ? [
            {
              testBatches: {
                some: {
                  batchId: filters.batchId,
                },
              },
            },
          ]
        : []),
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
  allowSectionSwitching: boolean;
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
      allowSectionSwitching: true,
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
        allowSectionSwitching: source.allowSectionSwitching ?? false,
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