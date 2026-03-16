"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type QuestionType =
  | "SINGLE_CORRECT"
  | "TRUE_FALSE"
  | "ASSERTION_REASON"
  | "MULTI_CORRECT"
  | "MATCH_THE_FOLLOWING";

type DifficultyLevel = "EASY" | "MEDIUM" | "HARD";
type QuestionStatus = "DRAFT" | "APPROVED" | "ACTIVE" | "REJECTED";

type QuestionFormProps = {
  mode?: "create" | "edit-placeholder";
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
  errors?: unknown;
};

const QUESTION_TYPES: QuestionType[] = [
  "SINGLE_CORRECT",
  "TRUE_FALSE",
  "ASSERTION_REASON",
  "MULTI_CORRECT",
  "MATCH_THE_FOLLOWING",
];

const DIFFICULTIES: DifficultyLevel[] = ["EASY", "MEDIUM", "HARD"];
const STATUSES: QuestionStatus[] = ["DRAFT", "APPROVED", "ACTIVE", "REJECTED"];

export function QuestionForm({ mode = "create" }: QuestionFormProps) {
  const router = useRouter();

  const [type, setType] = useState<QuestionType>("SINGLE_CORRECT");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("MEDIUM");
  const [status, setStatus] = useState<QuestionStatus>("DRAFT");
  const [questionText, setQuestionText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isOptionBased =
    type === "SINGLE_CORRECT" || type === "MULTI_CORRECT";

  const correctAnswerOptions = useMemo(() => {
    if (type === "TRUE_FALSE") {
      return ["TRUE", "FALSE"];
    }

    if (isOptionBased) {
      return ["A", "B", "C", "D"];
    }

    return [];
  }, [type, isOptionBased]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mode !== "create") {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = {
        type,
        difficulty,
        status,
        questionText: questionText.trim(),
        optionA: optionA.trim() || undefined,
        optionB: optionB.trim() || undefined,
        optionC: optionC.trim() || undefined,
        optionD: optionD.trim() || undefined,
        correctAnswer: correctAnswer.trim() || undefined,
        explanation: explanation.trim() || undefined,
        tags: tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      const response = await fetch("/api/admin/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = (await response.json().catch(() => null)) as ApiResponse<{
        id: string;
      }> | null;

      if (!response.ok || !json?.success) {
        throw new Error(json?.message || "Failed to create question.");
      }

      setSuccessMessage("Question created successfully.");

      router.push("/admin/questions");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to create question."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as QuestionType);
            setCorrectAnswer("");
          }}
          className="rounded-xl border px-4 py-3"
        >
          {QUESTION_TYPES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
          className="rounded-xl border px-4 py-3"
        >
          {DIFFICULTIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as QuestionStatus)}
          className="rounded-xl border px-4 py-3"
        >
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <textarea
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
        className="min-h-36 w-full rounded-xl border px-4 py-3"
        placeholder="Enter question text"
        required
      />

      {isOptionBased ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <input
            value={optionA}
            onChange={(e) => setOptionA(e.target.value)}
            className="rounded-xl border px-4 py-3"
            placeholder="Option A"
            required={isOptionBased}
          />
          <input
            value={optionB}
            onChange={(e) => setOptionB(e.target.value)}
            className="rounded-xl border px-4 py-3"
            placeholder="Option B"
            required={isOptionBased}
          />
          <input
            value={optionC}
            onChange={(e) => setOptionC(e.target.value)}
            className="rounded-xl border px-4 py-3"
            placeholder="Option C"
            required={isOptionBased}
          />
          <input
            value={optionD}
            onChange={(e) => setOptionD(e.target.value)}
            className="rounded-xl border px-4 py-3"
            placeholder="Option D"
            required={isOptionBased}
          />
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {correctAnswerOptions.length > 0 ? (
          <select
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            className="rounded-xl border px-4 py-3"
            required={type === "TRUE_FALSE" || isOptionBased}
          >
            <option value="">Select correct answer</option>
            {correctAnswerOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            className="rounded-xl border px-4 py-3"
            placeholder="Correct answer"
          />
        )}

        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="rounded-xl border px-4 py-3"
          placeholder="Tags separated by commas"
        />
      </div>

      <textarea
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
        className="min-h-28 w-full rounded-xl border px-4 py-3"
        placeholder="Explanation / solution"
      />

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting || mode !== "create"}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {submitting ? "Saving..." : "Save Question"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/admin/questions")}
          className="rounded-xl border px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}