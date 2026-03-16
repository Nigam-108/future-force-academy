import {
  DifficultyLevel,
  QuestionStatus,
  QuestionType,
} from "@prisma/client";
import { createQuestionRecord } from "@/server/repositories/question.repository";
import { AppError } from "@/server/utils/errors";
import type { BulkImportQuestionsInput } from "@/server/validations/question-import.schema";

/**
 * Internal parsed MCQ structure after reading pasted text.
 */
type ParsedMcq = {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "A" | "B" | "C" | "D";
  explanation?: string;
};

/**
 * Normalize line endings so pasted content behaves consistently
 * across Windows / Mac / browser environments.
 */
function normalizeText(input: string) {
  return input.replace(/\r\n/g, "\n").trim();
}

/**
 * Splits the raw textarea content into separate question blocks.
 *
 * Current import rule:
 * - each question block is separated by a line containing ---
 *
 * Example:
 * Question: ...
 * A: ...
 * B: ...
 * C: ...
 * D: ...
 * Answer: B
 * Explanation: ...
 * ---
 * Question: ...
 */
function splitIntoBlocks(rawText: string) {
  return normalizeText(rawText)
    .split(/\n\s*---\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean);
}

/**
 * Extracts one field from a block using a strict line-based prefix.
 *
 * Example:
 * prefix = "Question:"
 * line = "Question: What is 2 + 2?"
 * result = "What is 2 + 2?"
 */
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

/**
 * Extracts an optional field from a block.
 *
 * If not found, returns undefined.
 */
function extractOptionalField(block: string, prefix: string): string | undefined {
  const regex = new RegExp(`^${prefix}\\s*(.+)$`, "im");
  const match = block.match(regex);

  if (!match?.[1]?.trim()) {
    return undefined;
  }

  return match[1].trim();
}

/**
 * Parses one pasted question block into structured MCQ data.
 *
 * Expected format:
 * Question: ...
 * A: ...
 * B: ...
 * C: ...
 * D: ...
 * Answer: A/B/C/D
 * Explanation: ... (optional)
 */
function parseQuestionBlock(block: string, blockIndex: number): ParsedMcq {
  const questionText = extractRequiredField(block, "Question:", blockIndex);
  const optionA = extractRequiredField(block, "A:", blockIndex);
  const optionB = extractRequiredField(block, "B:", blockIndex);
  const optionC = extractRequiredField(block, "C:", blockIndex);
  const optionD = extractRequiredField(block, "D:", blockIndex);
  const answerRaw = extractRequiredField(block, "Answer:", blockIndex)
    .toUpperCase()
    .trim();
  const explanation = extractOptionalField(block, "Explanation:");

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
    optionA,
    optionB,
    optionC,
    optionD,
    correctAnswer: answerRaw as ParsedMcq["correctAnswer"],
    explanation,
  };
}

/**
 * Converts the full textarea content into validated structured MCQs.
 */
function parseBulkQuestions(rawText: string) {
  const blocks = splitIntoBlocks(rawText);

  if (blocks.length === 0) {
    throw new AppError("No valid question blocks found for import.", 422);
  }

  return blocks.map((block, index) => parseQuestionBlock(block, index));
}

/**
 * Main bulk import service.
 *
 * Current business rule:
 * - every imported question is created as:
 *   type = SINGLE_CORRECT
 *   difficulty = MEDIUM
 *   status = ACTIVE
 *   tags = []
 *
 * Why:
 * - matches your simplified admin workflow
 * - fastest possible entry for bulk question generation
 */
export async function bulkImportQuestions(
  input: BulkImportQuestionsInput,
  actorId: string
) {
  const parsedQuestions = parseBulkQuestions(input.rawText);

  const createdItems = [];

  /**
   * Sequential creation is used here intentionally.
   *
   * Why not Promise.all?
   * - easier error tracing
   * - safer if future hooks/logging are added
   * - simpler for debugging import failures
   */
  for (const item of parsedQuestions) {
    const created = await createQuestionRecord({
      createdById: actorId,
      type: QuestionType.SINGLE_CORRECT,
      difficulty: DifficultyLevel.MEDIUM,
      status: QuestionStatus.ACTIVE,
      questionText: item.questionText,
      optionA: item.optionA,
      optionB: item.optionB,
      optionC: item.optionC,
      optionD: item.optionD,
      correctAnswer: item.correctAnswer,
      explanation: item.explanation,
      tags: [],
    });

    createdItems.push(created);
  }

  return {
    totalImported: createdItems.length,
    items: createdItems,
  };
}