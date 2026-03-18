import { UserStatus } from "@prisma/client";
import { AppError } from "@/server/utils/errors";
import {
  findStudentSubmittedResultById,
  findStudentUserById,
  getAdminReportSummary,
  getAdminStudentById,
  getStudentDashboardStats,
  listAdminStudents,
  listStudentSubmittedResults,
  updateStudentStatus,
  updateStudentUserById,
} from "@/server/repositories/student.repository";
import { UpdateStudentProfileInput } from "@/server/validations/student-profile.schema";

import {
  findStudentBatchAssignments,
} from "@/server/repositories/batch.repository";

export async function getStudentDashboard(userId: string) {
  const student = await findStudentUserById(userId);

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  const [stats, batchMemberships] = await Promise.all([
    getStudentDashboardStats(userId),
    findStudentBatchAssignments(userId),
  ]);

  return {
    student,
    stats,
    batchMemberships,
  };
}

export async function getStudentProfile(userId: string) {
  const student = await findStudentUserById(userId);

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  return student;
}

export async function updateStudentProfile(userId: string, input: UpdateStudentProfileInput) {
  const student = await findStudentUserById(userId);

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  return updateStudentUserById(userId, {
    fullName: input.fullName,
    mobileNumber: Object.prototype.hasOwnProperty.call(input, "mobileNumber")
      ? input.mobileNumber ?? null
      : undefined,
    preferredLanguage: input.preferredLanguage,
  });
}

export async function getStudentResults(userId: string) {
  return listStudentSubmittedResults(userId);
}

export async function getStudentResultById(userId: string, attemptId: string) {
  const result = await findStudentSubmittedResultById(userId, attemptId);

  if (!result) {
    throw new AppError("Submitted result not found", 404);
  }

  const answerReview = result.answers.map((answer, index) => ({
    answerId: answer.id,
    questionNumber: index + 1,
    questionText: answer.testQuestion.question.questionText,
    selectedAnswer: answer.selectedAnswer,
    correctAnswer: answer.testQuestion.question.correctAnswer,
    explanation: answer.testQuestion.question.explanation,
    isAnswered: answer.isAnswered,
    isCorrect: answer.isCorrect,
    markedForReview: answer.markedForReview,
    sectionTitle: answer.testQuestion.section?.title ?? null,
  }));

  return {
    summary: {
      attemptId: result.id,
      testId: result.testId,
      testTitle: result.test.title,
      status: result.status,
      startedAt: result.startedAt,
      submittedAt: result.submittedAt,
      totalMarksObtained: result.totalMarksObtained,
      correctCount: result.correctCount,
      wrongCount: result.wrongCount,
      unansweredCount: result.unansweredCount,
      percentage: result.percentage,
      rank: result.rank,
    },
    sections: result.test.sections,
    answerReview,
  };
}

export async function getAdminStudents(params: {
  page: number;
  limit: number;
  search?: string;
  status?: UserStatus;
}) {
  return listAdminStudents(params);
}

export async function getAdminStudent(studentId: string) {
  const result = await getAdminStudentById(studentId);

  if (!result) {
    throw new AppError("Student not found", 404);
  }

  return result;
}

export async function blockStudent(studentId: string) {
  try {
    return await updateStudentStatus(studentId, UserStatus.BLOCKED);
  } catch {
    throw new AppError("Student not found", 404);
  }
}

export async function unblockStudent(studentId: string) {
  try {
    return await updateStudentStatus(studentId, UserStatus.ACTIVE);
  } catch {
    throw new AppError("Student not found", 404);
  }
}

export async function getAdminReports() {
  return getAdminReportSummary();
}