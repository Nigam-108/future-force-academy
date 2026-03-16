import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

const assignedQuestionInclude = {
  question: true,
  section: true,
} satisfies Prisma.TestQuestionInclude;

export type UpdateAssignedTestQuestionRecordInput = {
  sectionId?: string | null;
  positiveMarks?: number | null;
  negativeMarks?: number | null;
};

function shuffleIds(ids: string[]) {
  const next = [...ids];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[randomIndex]] = [next[randomIndex], next[index]];
  }

  return next;
}

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

    const allRows = await tx.testQuestion.findMany({
      where: { testId: params.testId },
      select: { id: true },
    });

    const shuffledIds = shuffleIds(allRows.map((item) => item.id));
    await writeDisplayOrder(tx, shuffledIds);

    return tx.testQuestion.findMany({
      where: { testId: params.testId },
      orderBy: { displayOrder: "asc" },
      include: assignedQuestionInclude,
    });
  });
}

export async function listAssignedTestQuestions(testId: string) {
  return prisma.testQuestion.findMany({
    where: { testId },
    orderBy: { displayOrder: "asc" },
    include: assignedQuestionInclude,
  });
}

export async function updateAssignedTestQuestionById(
  assignmentId: string,
  data: UpdateAssignedTestQuestionRecordInput
) {
  return prisma.testQuestion.update({
    where: { id: assignmentId },
    data,
    include: assignedQuestionInclude,
  });
}

export async function deleteAssignedTestQuestionById(assignmentId: string) {
  return prisma.testQuestion.delete({
    where: { id: assignmentId },
    include: assignedQuestionInclude,
  });
}

export async function normalizeAssignedTestQuestionOrder(testId: string) {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.testQuestion.findMany({
      where: { testId },
      orderBy: { displayOrder: "asc" },
      select: { id: true },
    });

    await writeDisplayOrder(
      tx,
      rows.map((item) => item.id)
    );

    return tx.testQuestion.findMany({
      where: { testId },
      orderBy: { displayOrder: "asc" },
      include: assignedQuestionInclude,
    });
  });
}