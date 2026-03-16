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

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
  errors?: unknown;
};

export type QuestionFormInitialValues = {
  type: QuestionType;
  difficulty: DifficultyLevel;
  status: QuestionStatus;
  questionText: string;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  correctAnswer: string | null;
  explanation: string | null;
  tags: string[];
};

type QuestionFormProps = {
  mode?: "create" | "edit";
  questionId?: string;
  initialValues?: QuestionFormInitialValues;
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

export function QuestionForm({
  mode = "create",
  questionId,
  initialValues,
}: QuestionFormProps) {
  const router = useRouter();

  const [type, setType] = useState<QuestionType>(
    initialValues?.type ?? "SINGLE_CORRECT"
  );
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    initialValues?.difficulty ?? "MEDIUM"
  );
  const [status, setStatus] = useState<QuestionStatus>(
    initialValues?.status ?? "DRAFT"
  );
  const [questionText, setQuestionText] = useState(
    initialValues?.questionText ?? ""
  );
  const [optionA, setOptionA] = useState(initialValues?.optionA ?? "");
  const [optionB, setOptionB] = useState(initialValues?.optionB ?? "");
  const [optionC, setOptionC] = useState(initialValues?.optionC ?? "");
  const [optionD, setOptionD] = useState(initialValues?.optionD ?? "");
  const [correctAnswer, setCorrectAnswer] = useState(
    initialValues?.correctAnswer ?? ""
  );
  const [explanation, setExplanation] = useState(
    initialValues?.explanation ?? ""
  );
  const [tags, setTags] = useState((initialValues?.tags ?? []).join(", "));
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    setSubmitting(true);
    setErrorMessage(null);

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

      const url =
        mode === "edit" && questionId
          ? `/api/admin/questions/${questionId}`
          : "/api/admin/questions";

      const method = mode === "edit" ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
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
        throw new Error(json?.message || "Failed to save question.");
      }

      router.push("/admin/questions");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save question."
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
          disabled={submitting}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {submitting
            ? mode === "edit"
              ? "Updating..."
              : "Saving..."
            : mode === "edit"
            ? "Update Question"
            : "Save Question"}
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