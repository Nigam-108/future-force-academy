"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type QuestionType =
  | "SINGLE_CORRECT"
  | "TRUE_FALSE"
  | "ASSERTION_REASON"
  | "MULTI_CORRECT"
  | "MATCH_THE_FOLLOWING";

type DifficultyLevel = "EASY" | "MEDIUM" | "HARD";
type QuestionStatus = "DRAFT" | "APPROVED" | "ACTIVE" | "REJECTED";
type AnswerOption = "A" | "B" | "C" | "D";

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

type QuestionFormState = {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: AnswerOption | "";
  explanation: string;
};

const ANSWER_OPTIONS: Array<{
  key: AnswerOption;
  label: string;
  field: keyof Pick<
    QuestionFormState,
    "optionA" | "optionB" | "optionC" | "optionD"
  >;
}> = [
  { key: "A", label: "A", field: "optionA" },
  { key: "B", label: "B", field: "optionB" },
  { key: "C", label: "C", field: "optionC" },
  { key: "D", label: "D", field: "optionD" },
];

function buildFormState(
  initialValues?: QuestionFormInitialValues
): QuestionFormState {
  const nextCorrectAnswer = initialValues?.correctAnswer;

  return {
    questionText: initialValues?.questionText ?? "",
    optionA: initialValues?.optionA ?? "",
    optionB: initialValues?.optionB ?? "",
    optionC: initialValues?.optionC ?? "",
    optionD: initialValues?.optionD ?? "",
    correctAnswer:
      nextCorrectAnswer === "A" ||
      nextCorrectAnswer === "B" ||
      nextCorrectAnswer === "C" ||
      nextCorrectAnswer === "D"
        ? nextCorrectAnswer
        : "",
    explanation: initialValues?.explanation ?? "",
  };
}

export function QuestionForm({
  mode = "create",
  questionId,
  initialValues,
}: QuestionFormProps) {
  const router = useRouter();

  const [form, setForm] = useState<QuestionFormState>(() =>
    buildFormState(initialValues)
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function updateField<K extends keyof QuestionFormState>(
    key: K,
    value: QuestionFormState[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function resetCreateForm() {
    setForm(buildFormState());
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = {
        questionText: form.questionText.trim(),
        optionA: form.optionA.trim(),
        optionB: form.optionB.trim(),
        optionC: form.optionC.trim(),
        optionD: form.optionD.trim(),
        correctAnswer: form.correctAnswer,
        explanation: form.explanation.trim() || undefined,
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

      if (mode === "create") {
        resetCreateForm();
        setSuccessMessage(
          "MCQ saved successfully. You can continue adding the next question."
        );
        return;
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

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
        <p className="font-semibold">Quick MCQ mode</p>
        <p className="mt-1">
          Every save creates a fast single-correct MCQ. Difficulty, tags, and
          status are temporarily hidden and handled automatically in backend.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-800">
          Question text
        </label>
        <textarea
          value={form.questionText}
          onChange={(event) => updateField("questionText", event.target.value)}
          className="min-h-36 w-full rounded-2xl border px-4 py-3"
          placeholder="Enter the full question here"
          required
        />
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">Options</p>
          <p className="mt-1 text-xs text-slate-500">
            Tap the circle in front of an option to mark it as the correct answer.
          </p>
        </div>

        <div className="space-y-3">
          {ANSWER_OPTIONS.map((item) => (
            <label
              key={item.key}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                form.correctAnswer === item.key
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <input
                type="radio"
                name="correctAnswer"
                value={item.key}
                checked={form.correctAnswer === item.key}
                onChange={() => updateField("correctAnswer", item.key)}
                className="h-4 w-4"
                required
              />

              <span className="w-7 shrink-0 text-sm font-semibold text-slate-600">
                {item.label}.
              </span>

              <input
                value={form[item.field]}
                onChange={(event) => updateField(item.field, event.target.value)}
                className="w-full bg-transparent text-sm outline-none"
                placeholder={`Option ${item.label}`}
                required
              />
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-800">
          Explanation / solution (optional)
        </label>
        <textarea
          value={form.explanation}
          onChange={(event) => updateField("explanation", event.target.value)}
          className="min-h-28 w-full rounded-2xl border px-4 py-3"
          placeholder="Add a short explanation if needed"
        />
      </div>

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
            ? "Update MCQ"
            : "Save MCQ"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/admin/questions")}
          className="rounded-xl border px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          {mode === "edit" ? "Cancel" : "View Question Bank"}
        </button>
      </div>
    </form>
  );
}