import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

/**
 * Shared include config for assigned test-question rows.
 *
 * Keeps all read/write flows consistent and avoids repeating nested include blocks.
 */
const assignedQuestionInclude = {
  question: true,
  section: true,
} satisfies Prisma.TestQuestionInclude;

/**
 * Input used when updating a single assigned row.
 *
 * In the simplified workflow:
 * - displayOrder is NOT edited manually by admin
 * - section / marks remain editable
 */
export type UpdateAssignedTestQuestionRecordInput = {
  sectionId?: string | null;
  positiveMarks?: number | null;
  negativeMarks?: number | null;
};

/**
 * Fisher-Yates shuffle for randomizing assigned question order.
 *
 * Why:
 * Admin should not manually enter displayOrder anymore.
 * The backend generates and shuffles order automatically.
 */
function shuffleIds(ids: string[]) {
  const next = [...ids];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[randomIndex]] = [next[randomIndex], next[index]];
  }

  return next;
}

/**
 * Rewrites displayOrder values sequentially based on the given row order.
 *
 * Why this exists:
 * - displayOrder must remain a clean 1..N sequence
 * - after add/remove operations, ordering should stay valid
 */
async function writeDisplayOrder(
  tx: Prisma.TransactionClient,
  orderedIds: string[]
) {
  await Promise.all(
    orderedIds.map((id, index) =>
      tx.testQuestion.update({
        where: { id },
        data: { displayOrder: index + 1 },
      })
    )
  );
}

/**
 * Recalculates and persists parent test totals from assigned rows.
 *
 * Business rules:
 * - totalQuestions = number of assigned rows
 * - totalMarks = sum of positiveMarks
 * - null positiveMarks is treated as 0
 */
async function syncTestTotals(tx: Prisma.TransactionClient, testId: string) {
  const aggregate = await tx.testQuestion.aggregate({
    where: { testId },
    _count: {
      id: true,
    },
    _sum: {
      positiveMarks: true,
    },
  });

  const totalQuestions = aggregate._count.id ?? 0;
  const totalMarks = Number(aggregate._sum.positiveMarks ?? 0);

  await tx.test.update({
    where: { id: testId },
    data: {
      totalQuestions,
      totalMarks,
    },
  });

  return {
    totalQuestions,
    totalMarks,
  };
}

/**
 * Fetch test + sections + assigned rows for admin assignment workflows.
 */
export async function findTestForQuestionAssignment(testId: string) {
  return prisma.test.findUnique({
    where: { id: testId },
    include: {
      sections: {
        orderBy: { displayOrder: "asc" },
      },
      testQuestions: {
        orderBy: { displayOrder: "asc" },
        include: assignedQuestionInclude,
      },
    },
  });
}

/**
 * Fetch question records for validating assignment input.
 */
export async function findQuestionsByIds(questionIds: string[]) {
  return prisma.question.findMany({
    where: {
      id: {
        in: questionIds,
      },
    },
    select: {
      id: true,
      questionText: true,
      correctAnswer: true,
      status: true,
      type: true,
      difficulty: true,
    },
  });
}

/**
 * Fetch section records for validating section ownership.
 */
export async function findSectionsByIds(sectionIds: string[]) {
  return prisma.testSection.findMany({
    where: {
      id: {
        in: sectionIds,
      },
    },
    select: {
      id: true,
      testId: true,
      title: true,
      displayOrder: true,
    },
  });
}

/**
 * Creates new assigned rows for a test.
 *
 * Important:
 * - displayOrder is generated automatically
 * - after creation, all assigned rows are shuffled
 * - totals are recalculated and persisted on the parent test
 */
export async function createAssignedTestQuestions(params: {
  testId: string;
  items: Array<{
    questionId: string;
    sectionId?: string | null;
    positiveMarks?: number | null;
    negativeMarks?: number | null;
  }>;
}) {
  return prisma.$transaction(async (tx) => {
    /**
     * Temporary initial displayOrder values are assigned in append order.
     * They are randomized immediately after creation.
     */
    const existingCount = await tx.testQuestion.count({
      where: { testId: params.testId },
    });

    await tx.testQuestion.createMany({
      data: params.items.map((item, index) => ({
        testId: params.testId,
        questionId: item.questionId,
        sectionId: item.sectionId ?? null,
        displayOrder: existingCount + index + 1,
        positiveMarks: item.positiveMarks ?? null,
        negativeMarks: item.negativeMarks ?? null,
      })),
    });

    /**
     * Shuffle the entire assigned set so order is fully backend-managed.
     */
    const allRows = await tx.testQuestion.findMany({
      where: { testId: params.testId },
      select: { id: true },
    });

    const shuffledIds = shuffleIds(allRows.map((item) => item.id));
    await writeDisplayOrder(tx, shuffledIds);

    const totals = await syncTestTotals(tx, params.testId);

    const items = await tx.testQuestion.findMany({
      where: { testId: params.testId },
      orderBy: { displayOrder: "asc" },
      include: assignedQuestionInclude,
    });

    return {
      items,
      totals,
    };
  });
}

/**
 * Lists assigned rows for admin page rendering.
 */
export async function listAssignedTestQuestions(testId: string) {
  return prisma.testQuestion.findMany({
    where: { testId },
    orderBy: { displayOrder: "asc" },
    include: assignedQuestionInclude,
  });
}

/**
 * Updates one assigned row and refreshes test totals.
 */
export async function updateAssignedTestQuestionById(
  testId: string,
  assignmentId: string,
  data: UpdateAssignedTestQuestionRecordInput
) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.testQuestion.update({
      where: { id: assignmentId },
      data,
      include: assignedQuestionInclude,
    });

    const totals = await syncTestTotals(tx, testId);

    return {
      item,
      totals,
    };
  });
}

/**
 * Deletes one assigned row, normalizes display order, and refreshes test totals.
 */
export async function deleteAssignedTestQuestionById(
  testId: string,
  assignmentId: string
) {
  return prisma.$transaction(async (tx) => {
    const deleted = await tx.testQuestion.delete({
      where: { id: assignmentId },
      include: assignedQuestionInclude,
    });

    const remainingRows = await tx.testQuestion.findMany({
      where: { testId },
      orderBy: { displayOrder: "asc" },
      select: { id: true },
    });

    await writeDisplayOrder(
      tx,
      remainingRows.map((item) => item.id)
    );

    const totals = await syncTestTotals(tx, testId);

    return {
      deleted,
      totals,
    };
  });
}

export async function deleteSelectedAssignedTestQuestions(
  testId: string,
  assignmentIds: string[]
) {
  return prisma.$transaction(async (tx) => {
    const deleted = await tx.testQuestion.deleteMany({
      where: {
        testId,
        id: {
          in: assignmentIds,
        },
      },
    });

    const remainingRows = await tx.testQuestion.findMany({
      where: { testId },
      orderBy: { displayOrder: "asc" },
      select: { id: true },
    });

    await writeDisplayOrder(
      tx,
      remainingRows.map((item) => item.id)
    );

    const totals = await syncTestTotals(tx, testId);

    return {
      deletedCount: deleted.count,
      totals,
    };
  });
}

export async function deleteAllAssignedTestQuestions(testId: string) {
  return prisma.$transaction(async (tx) => {
    const deleted = await tx.testQuestion.deleteMany({
      where: { testId },
    });

    const totals = await syncTestTotals(tx, testId);

    return {
      deletedCount: deleted.count,
      totals,
    };
  });
}