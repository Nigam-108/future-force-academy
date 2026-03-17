import { AppError } from "@/server/utils/errors";
import { findTestPreviewById } from "@/server/repositories/test-preview.repository";

/**
 * Builds admin paper preview data.
 *
 * This view is meant for:
 * - checking the final test structure
 * - reading all assigned questions in final order
 * - verifying section placement and marks
 */
export async function getTestPaperPreview(testId: string) {
  const test = await findTestPreviewById(testId);

  if (!test) {
    throw new AppError("Test not found", 404);
  }

  return {
    test: {
      id: test.id,
      title: test.title,
      slug: test.slug,
      description: test.description,
      mode: test.mode,
      structureType: test.structureType,
      visibilityStatus: test.visibilityStatus,
      totalQuestions: test.totalQuestions,
      totalMarks: test.totalMarks,
      durationInMinutes: test.durationInMinutes,
      startAt: test.startAt,
      endAt: test.endAt,
    },
    sections: test.sections,
    questions: test.testQuestions.map((item, index) => ({
      assignmentId: item.id,
      questionNumber: index + 1,
      displayOrder: item.displayOrder,
      sectionTitle: item.section?.title ?? null,
      positiveMarks: item.positiveMarks,
      negativeMarks: item.negativeMarks,
      question: {
        id: item.question.id,
        questionText: item.question.questionText,
        optionA: item.question.optionA,
        optionB: item.question.optionB,
        optionC: item.question.optionC,
        optionD: item.question.optionD,
        correctAnswer: item.question.correctAnswer,
        explanation: item.question.explanation,
      },
    })),
  };
}

/**
 * Builds answer key preview data.
 *
 * Why separate service?
 * - keeps future customization easy
 * - allows answer-key specific formatting later
 */
export async function getTestAnswerKeyPreview(testId: string) {
  const preview = await getTestPaperPreview(testId);

  return {
    test: preview.test,
    questions: preview.questions.map((item) => ({
      questionNumber: item.questionNumber,
      sectionTitle: item.sectionTitle,
      correctAnswer: item.question.correctAnswer,
      explanation: item.question.explanation,
      positiveMarks: item.positiveMarks,
      negativeMarks: item.negativeMarks,
      questionText: item.question.questionText,
    })),
  };
}