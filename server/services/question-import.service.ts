import { logActivity, ACTIONS } from "@/server/services/activity.service";
import {
  DifficultyLevel,
  QuestionStatus,
  QuestionType,
} from "@prisma/client";
import { createQuestionRecord } from "@/server/repositories/question.repository";
import { AppError } from "@/server/utils/errors";
import type { BulkImportQuestionsInput } from "@/server/validations/question-import.schema";

// ─── Internal parsed MCQ structure ────────────────────────────────────────────
type ParsedMcq = {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "A" | "B" | "C" | "D";
  explanation?: string;
};

// Normalize line endings across Windows/Mac/browser
function normalizeText(input: string) {
  return input.replace(/\r\n/g, "\n").trim();
}

// Split raw textarea into question blocks separated by ---
function splitIntoBlocks(rawText: string) {
  return normalizeText(rawText)
    .split(/\n\s*---\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean);
}

// Extract a required field from a block — throws if missing
function extractRequiredField(
  block: string,
  prefix: string,
  blockIndex: number
): string {
  const regex = new RegExp(`^${prefix}\\s*(.+)$`, "im");
  const match = block.match(regex);

  if (!match?.[1]?.trim()) {
    throw new AppError(
      `Import error in question block ${blockIndex + 1}: Missing ${prefix.replace(":", "")}.`,
      422
    );
  }

  return match[1].trim();
}

// Extract an optional field — returns undefined if not found
function extractOptionalField(block: string, prefix: string): string | undefined {
  const regex = new RegExp(`^${prefix}\\s*(.+)$`, "im");
  const match = block.match(regex);
  if (!match?.[1]?.trim()) return undefined;
  return match[1].trim();
}

// Parse one question block into structured MCQ data
function parseQuestionBlock(block: string, blockIndex: number): ParsedMcq {
  const questionText = extractRequiredField(block, "Question:", blockIndex);
  const optionA      = extractRequiredField(block, "A:", blockIndex);
  const optionB      = extractRequiredField(block, "B:", blockIndex);
  const optionC      = extractRequiredField(block, "C:", blockIndex);
  const optionD      = extractRequiredField(block, "D:", blockIndex);
  const answerRaw    = extractRequiredField(block, "Answer:", blockIndex).toUpperCase().trim();
  const explanation  = extractOptionalField(block, "Explanation:");

  if (!["A", "B", "C", "D"].includes(answerRaw)) {
    throw new AppError(
      `Import error in question block ${blockIndex + 1}: Answer must be A, B, C or D.`,
      422
    );
  }

  const normalizedOptions = [optionA, optionB, optionC, optionD].map((item) =>
    item.trim().toLowerCase()
  );

  if (new Set(normalizedOptions).size !== normalizedOptions.length) {
    throw new AppError(
      `Import error in question block ${blockIndex + 1}: Options A, B, C and D must all be different.`,
      422
    );
  }

  return {
    questionText,
    optionA, optionB, optionC, optionD,
    correctAnswer: answerRaw as ParsedMcq["correctAnswer"],
    explanation,
  };
}

// Parse full textarea into array of validated MCQs
function parseBulkQuestions(rawText: string) {
  const blocks = splitIntoBlocks(rawText);

  if (blocks.length === 0) {
    throw new AppError("No valid question blocks found for import.", 422);
  }

  return blocks.map((block, index) => parseQuestionBlock(block, index));
}

// ─── Main bulk import service ─────────────────────────────────────────────────
// actorFullName added so we can log who did the import
export async function bulkImportQuestions(
  input: BulkImportQuestionsInput,
  actorId: string,
  actorFullName: string = "Admin"  // default fallback
) {
  const parsedQuestions = parseBulkQuestions(input.rawText);

  const createdItems = [];

  // Sequential creation — easier error tracing than Promise.all for imports
  for (const item of parsedQuestions) {
    const created = await createQuestionRecord({
      createdById: actorId,
      type:        QuestionType.SINGLE_CORRECT,
      difficulty:  DifficultyLevel.MEDIUM,
      status:      QuestionStatus.ACTIVE,
      questionText: item.questionText,
      optionA:      item.optionA,
      optionB:      item.optionB,
      optionC:      item.optionC,
      optionD:      item.optionD,
      correctAnswer: item.correctAnswer,
      explanation:   item.explanation,
      tags: [],
    });

    createdItems.push(created);
  }

  // Log AFTER all questions successfully imported — inside function using real count
  await logActivity({
    userId:       actorId,
    userFullName: actorFullName,
    action:       ACTIONS.QUESTION_IMPORTED,
    description:  `Bulk imported ${createdItems.length} questions`,
    resourceType: "question",
    metadata:     { count: createdItems.length },
  });

  return {
    totalImported: createdItems.length,
    items: createdItems,
  };
}