/**
 * E0 — Shared Student Foundation
 * section-state.ts
 *
 * Builds section groups for sectional test attempts.
 *
 * KEY FIX vs old version:
 * - Question numbering is now SECTION-RELATIVE and CONTINUOUS
 * - Section A questions → Q1, Q2, Q3
 * - Section B questions → Q4, Q5, Q6, Q7, Q8
 * - NOT based on question bank order (which caused Q2-Q4, Q1-Q5 bug)
 *
 * Also handles:
 * - malformed assignments (questions not assigned to any section)
 * - section-wise cumulative timing for timed sections
 * - safe fallbacks when section data is incomplete
 *
 * Used by:
 * - attempt-page-client.tsx (E4, E5)
 * - section-panel.tsx
 * - test instructions page (E3)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type StudentAttemptSectionLite = {
  id: string;
  title: string;
  displayOrder: number;
  totalQuestions: number;
  durationInMinutes: number | null;
};

export type StudentAttemptQuestionLite = {
  questionNumber: number;
  sectionId: string | null;
  sectionTitle: string | null;
};

/**
 * A processed section group ready for the attempt UI.
 *
 * questionIndexes          → array positions in the questions array
 * startQuestionNumber      → first student-facing Q number (e.g. 4)
 * endQuestionNumber        → last student-facing Q number (e.g. 8)
 * studentFacingStart       → same as startQuestionNumber (explicit alias)
 * studentFacingEnd         → same as endQuestionNumber (explicit alias)
 * cumulativeStartSeconds   → when this section's timer starts (0 for section 1)
 * cumulativeEndSeconds     → when this section's timer ends
 */
export type StudentSectionGroup = {
  id: string;
  title: string;
  displayOrder: number;
  durationInMinutes: number | null;
  questionIndexes: number[];
  // Question bank original numbers (for internal use only)
  rawStartQuestionNumber: number | null;
  rawEndQuestionNumber: number | null;
  // Student-facing continuous numbers (use THESE in UI)
  studentFacingStart: number | null;
  studentFacingEnd: number | null;
  // Timing
  cumulativeStartSeconds: number;
  cumulativeEndSeconds: number;
};

export type BuiltSectionState = {
  groups: StudentSectionGroup[];
  questionSectionIndexes: number[];
  hasMalformedAssignments: boolean;
  /**
   * studentFacingNumbers[i] = the student-facing question number for
   * the question at index i in the questions array.
   * Always starts at 1 and increments continuously across sections.
   */
  studentFacingNumbers: number[];
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

function normalizeTitle(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

// ─── Main builder ─────────────────────────────────────────────────────────────

/**
 * Builds section groups from API response data.
 *
 * Student-facing numbering algorithm:
 * 1. Sort sections by displayOrder
 * 2. For each section, collect its questions IN the order they appear
 *    in the questions array (which backend sorts by displayOrder)
 * 3. Assign continuous numbers: first section Q1..Qn, second section
 *    Q(n+1)..Q(n+m), etc.
 * 4. Questions not assigned to any section go to a fallback group
 *    and hasMalformedAssignments is set true
 */
export function buildAttemptSectionGroups(
  data: {
    sections: StudentAttemptSectionLite[];
    questions: StudentAttemptQuestionLite[];
  } | null
): BuiltSectionState {
  if (!data) {
    return {
      groups: [],
      questionSectionIndexes: [],
      hasMalformedAssignments: false,
      studentFacingNumbers: [],
    };
  }

  // Sort sections by displayOrder
  const sections = data.sections
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder);

  // Build lookup maps for fast matching
  const sectionIndexById = new Map<string, number>();
  const sectionIndexByTitle = new Map<string, number>();

  sections.forEach((section, index) => {
    sectionIndexById.set(section.id, index);
    sectionIndexByTitle.set(normalizeTitle(section.title), index);
  });

  // Map each question to its section index
  const questionSectionIndexes = data.questions.map((question) => {
    if (question.sectionId && sectionIndexById.has(question.sectionId)) {
      return sectionIndexById.get(question.sectionId) ?? -1;
    }
    if (question.sectionTitle) {
      return (
        sectionIndexByTitle.get(normalizeTitle(question.sectionTitle)) ?? -1
      );
    }
    return -1;
  });

  const hasMalformedAssignments =
    sections.length > 0 && questionSectionIndexes.some((index) => index < 0);

  // Build section groups with student-facing continuous numbering
  let runningSeconds = 0;
  // studentFacingCounter tracks the next student-facing Q number
  let studentFacingCounter = 1;

  // Initialize studentFacingNumbers array
  const studentFacingNumbers = new Array<number>(data.questions.length).fill(0);

  const groups: StudentSectionGroup[] = sections.map(
    (section, sectionIndex) => {
      // Collect question indexes for this section IN ORDER
      const questionIndexes = questionSectionIndexes
        .map((si, qi) => (si === sectionIndex ? qi : -1))
        .filter((qi) => qi >= 0);

      // Assign student-facing numbers to this section's questions
      const sectionStudentStart =
        questionIndexes.length > 0 ? studentFacingCounter : null;

      questionIndexes.forEach((qi) => {
        studentFacingNumbers[qi] = studentFacingCounter;
        studentFacingCounter += 1;
      });

      const sectionStudentEnd =
        questionIndexes.length > 0 ? studentFacingCounter - 1 : null;

      // Raw question bank numbers (original, for reference only)
      const rawStart =
        questionIndexes.length > 0
          ? (data.questions[questionIndexes[0]]?.questionNumber ?? null)
          : null;
      const rawEnd =
        questionIndexes.length > 0
          ? (data.questions[questionIndexes[questionIndexes.length - 1]]
              ?.questionNumber ?? null)
          : null;

      // Cumulative timing
      const cumulativeStartSeconds = runningSeconds;
      runningSeconds += Math.max(
        (section.durationInMinutes ?? 0) * 60,
        0
      );

      return {
        id: section.id,
        title: section.title,
        displayOrder: section.displayOrder,
        durationInMinutes: section.durationInMinutes,
        questionIndexes,
        rawStartQuestionNumber: rawStart,
        rawEndQuestionNumber: rawEnd,
        studentFacingStart: sectionStudentStart,
        studentFacingEnd: sectionStudentEnd,
        cumulativeStartSeconds,
        cumulativeEndSeconds: runningSeconds,
      };
    }
  );

  return {
    groups,
    questionSectionIndexes,
    hasMalformedAssignments,
    studentFacingNumbers,
  };
}

/**
 * Gets the current timed section index based on elapsed seconds.
 * Used for section-wise timer tests.
 */
export function getTimedSectionIndex(
  groups: StudentSectionGroup[],
  elapsedSeconds: number
): number {
  if (groups.length === 0) return 0;

  for (let i = 0; i < groups.length; i++) {
    if (elapsedSeconds < groups[i].cumulativeEndSeconds) {
      return i;
    }
  }

  return groups.length - 1;
}

/**
 * Returns the total number of questions assigned across all sections.
 * Used on instructions page to show accurate section question counts.
 */
export function getSectionAssignedCounts(
  groups: StudentSectionGroup[]
): Map<string, number> {
  const counts = new Map<string, number>();
  groups.forEach((group) => {
    counts.set(group.id, group.questionIndexes.length);
  });
  return counts;
}