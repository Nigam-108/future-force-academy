import { AppError } from "@/server/utils/errors";
import {
  ATTEMPT_STATUS,
  findTestAnalyticsById,
} from "@/server/repositories/report-analytics.repository";

/**
 * Builds a detailed analytics summary for one test.
 *
 * Current KPIs:
 * - total attempts
 * - submitted attempts
 * - in-progress attempts
 * - average marks
 * - average percentage
 * - highest score
 *
 * Why this is useful:
 * - gives admin quick quality/performance visibility
 * - helps verify real student participation
 */
export async function getTestAnalytics(testId: string) {
  const test = await findTestAnalyticsById(testId);

  if (!test) {
    throw new AppError("Test not found", 404);
  }

  const totalAttempts = test.attempts.length;
  const submittedAttempts = test.attempts.filter(
    (attempt) => attempt.status === ATTEMPT_STATUS.SUBMITTED
  );
  const inProgressAttempts = test.attempts.filter(
    (attempt) => attempt.status === ATTEMPT_STATUS.IN_PROGRESS
  );

  const submittedCount = submittedAttempts.length;
  const inProgressCount = inProgressAttempts.length;

  const totalMarksObtainedSum = submittedAttempts.reduce(
    (sum, attempt) => sum + Number(attempt.totalMarksObtained ?? 0),
    0
  );

  const totalPercentageSum = submittedAttempts.reduce(
    (sum, attempt) => sum + Number(attempt.percentage ?? 0),
    0
  );

  const averageMarks =
    submittedCount > 0
      ? Number((totalMarksObtainedSum / submittedCount).toFixed(2))
      : 0;

  const averagePercentage =
    submittedCount > 0
      ? Number((totalPercentageSum / submittedCount).toFixed(2))
      : 0;

  const highestMarks =
    submittedCount > 0
      ? Math.max(...submittedAttempts.map((attempt) => Number(attempt.totalMarksObtained ?? 0)))
      : 0;

  const highestPercentage =
    submittedCount > 0
      ? Math.max(...submittedAttempts.map((attempt) => Number(attempt.percentage ?? 0)))
      : 0;

  return {
    test: {
      id: test.id,
      title: test.title,
      slug: test.slug,
      totalQuestions: test.totalQuestions,
      totalMarks: test.totalMarks,
      mode: test.mode,
      structureType: test.structureType,
      visibilityStatus: test.visibilityStatus,
    },
    summary: {
      totalAttempts,
      submittedCount,
      inProgressCount,
      averageMarks,
      averagePercentage,
      highestMarks,
      highestPercentage,
    },
    attempts: test.attempts.map((attempt) => ({
      id: attempt.id,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      totalMarksObtained: attempt.totalMarksObtained,
      percentage: attempt.percentage,
      correctCount: attempt.correctCount,
      wrongCount: attempt.wrongCount,
      unansweredCount: attempt.unansweredCount,
      user: {
        id: attempt.user?.id ?? null,
        fullName: attempt.user?.fullName ?? "Unknown User",
        email: attempt.user?.email ?? "—",
      },
    })),
  };
}