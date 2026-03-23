import { createActivityLog, type CreateActivityLogInput } from "@/server/repositories/activity.repository";

// ─── logActivity — main helper used everywhere ────────────────────────────────
// Call this after any significant admin action in service layer
// It's designed to NEVER throw — if logging fails, the main action still succeeds
//
// Usage example:
//   await logActivity({
//     userId: session.userId,
//     userFullName: session.fullName,
//     action: "question.created",
//     description: `Created question: "${title}"`,
//     resourceType: "question",
//     resourceId: question.id,
//   });
export async function logActivity(input: CreateActivityLogInput): Promise<void> {
  try {
    await createActivityLog(input);
  } catch (err) {
    // Logging should NEVER break the main action
    // Just silently log to console — don't throw
    console.error("[ActivityLog] Failed to save log entry:", err);
  }
}

// ─── Pre-built action constants ───────────────────────────────────────────────
// Use these instead of raw strings to avoid typos across the codebase
export const ACTIONS = {
  // Questions
  QUESTION_CREATED:  "question.created",
  QUESTION_UPDATED:  "question.updated",
  QUESTION_DELETED:  "question.deleted",
  QUESTION_IMPORTED: "question.imported",

  // Tests
  TEST_CREATED:      "test.created",
  TEST_UPDATED:      "test.updated",
  TEST_DELETED:      "test.deleted",
  TEST_DUPLICATED:   "test.duplicated",

  // Batches
  BATCH_CREATED:     "batch.created",
  BATCH_UPDATED:     "batch.updated",
  BATCH_DELETED:     "batch.deleted",
  BATCH_STATUS:      "batch.status_changed",

  // Students
  STUDENT_BLOCKED:   "student.blocked",
  STUDENT_UNBLOCKED: "student.unblocked",
  STUDENT_ENROLLED:  "student.manually_enrolled",

  // Payments
  PAYMENT_RECONCILED:   "payment.reconciled",
  PAYMENT_STATUS:       "payment.status_updated",

  // Coupons
  COUPON_CREATED:    "coupon.created",
  COUPON_TOGGLED:    "coupon.toggled",

  // Permissions
  PERMISSION_UPDATED: "permission.updated",
} as const;