import { prisma } from "@/server/db/prisma";

/**
 * Fetches a full test preview for admin paper rendering.
 *
 * Includes:
 * - test metadata
 * - sections
 * - assigned test questions
 * - linked question details
 *
 * Why:
 * The paper preview and answer key preview both need the same base dataset.
 */
export async function findTestPreviewById(testId: string) {
  return prisma.test.findUnique({
    where: { id: testId },
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
        include: {
          question: true,
          section: true,
        },
      },
    },
  });
}