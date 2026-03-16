import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

const assignedQuestionInclude = {
  question: true,
  section: true,
} satisfies Prisma.TestQuestionInclude;

export type UpdateAssignedTestQuestionRecordInput = {
  sectionId?: string | null;
  displayOrder?: number;
  positiveMarks?: number | null;
  negativeMarks?: number | null;
};

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
    displayOrder: number;
    positiveMarks?: number | null;
    negativeMarks?: number | null;
  }>;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.testQuestion.createMany({
      data: params.items.map((item) => ({
        testId: params.testId,
        questionId: item.questionId,
        sectionId: item.sectionId ?? null,
        displayOrder: item.displayOrder,
        positiveMarks: item.positiveMarks ?? null,
        negativeMarks: item.negativeMarks ?? null,
      })),
    });

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