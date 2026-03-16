import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";

export const dynamic = "force-dynamic";

type QuestionsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type QuestionType =
  | "SINGLE_CORRECT"
  | "TRUE_FALSE"
  | "ASSERTION_REASON"
  | "MULTI_CORRECT"
  | "MATCH_THE_FOLLOWING";

type DifficultyLevel = "EASY" | "MEDIUM" | "HARD";

type QuestionStatus = "DRAFT" | "APPROVED" | "ACTIVE" | "REJECTED";

type AdminQuestionsResponse = {
  items: Array<{
    id: string;
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
    createdAt: string;
    updatedAt: string;
    createdBy: {
      id: string;
      fullName: string;
      email: string;
    } | null;
    approvedBy: {
      id: string;
      fullName: string;
      email: string;
    } | null;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildPageHref(
  currentSearchParams: Record<string, string | string[] | undefined>,
  nextPage: number
) {
  const params = new URLSearchParams();

  const search = getSingleValue(currentSearchParams.search);
  const type = getSingleValue(currentSearchParams.type);
  const difficulty = getSingleValue(currentSearchParams.difficulty);
  const status = getSingleValue(currentSearchParams.status);

  if (search) params.set("search", search);
  if (type) params.set("type", type);
  if (difficulty) params.set("difficulty", difficulty);
  if (status) params.set("status", status);

  params.set("page", String(nextPage));
  params.set("limit", "10");

  return `/admin/questions?${params.toString()}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function typeBadgeClass(type: QuestionType) {
  switch (type) {
    case "SINGLE_CORRECT":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "MULTI_CORRECT":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    case "TRUE_FALSE":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "ASSERTION_REASON":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "MATCH_THE_FOLLOWING":
      return "bg-pink-50 text-pink-700 ring-pink-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function statusBadgeClass(status: QuestionStatus) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "APPROVED":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "DRAFT":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "REJECTED":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function difficultyBadgeClass(difficulty: DifficultyLevel) {
  switch (difficulty) {
    case "EASY":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "MEDIUM":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "HARD":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function truncateText(text: string, limit = 180) {
  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit)}...`;
}

function QuestionCard({
  question,
}: {
  question: AdminQuestionsResponse["items"][number];
}) {
  return (
    <article className="rounded-3xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <span
              className={`rounded-full px-3 py-1 ring-1 ${typeBadgeClass(
                question.type
              )}`}
            >
              {question.type}
            </span>
            <span
              className={`rounded-full px-3 py-1 ring-1 ${difficultyBadgeClass(
                question.difficulty
              )}`}
            >
              {question.difficulty}
            </span>
            <span
              className={`rounded-full px-3 py-1 ring-1 ${statusBadgeClass(
                question.status
              )}`}
            >
              {question.status}
            </span>
          </div>

          <h2 className="text-base font-semibold leading-7 text-slate-900">
            {truncateText(question.questionText, 220)}
          </h2>
        </div>

        <Link
          href={`/admin/questions/${question.id}/edit`}
          className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Edit
        </Link>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Correct Answer</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {question.correctAnswer || "—"}
          </div>
        </div>

        <div className="rounded-2xl border bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Created By</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {question.createdBy?.fullName || "—"}
          </div>
        </div>

        <div className="rounded-2xl border bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Approved By</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {question.approvedBy?.fullName || "—"}
          </div>
        </div>

        <div className="rounded-2xl border bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Created At</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {formatDateTime(question.createdAt)}
          </div>
        </div>
      </div>

      {question.tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {question.tags.map((tag) => (
            <span
              key={`${question.id}-${tag}`}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export default async function QuestionsPage({
  searchParams,
}: QuestionsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};

  const page = getSingleValue(resolvedSearchParams.page) || "1";
  const limit = getSingleValue(resolvedSearchParams.limit) || "10";
  const search = getSingleValue(resolvedSearchParams.search) || "";
  const type = getSingleValue(resolvedSearchParams.type) || "";
  const difficulty = getSingleValue(resolvedSearchParams.difficulty) || "";
  const status = getSingleValue(resolvedSearchParams.status) || "";

  const result = await fetchInternalApi<AdminQuestionsResponse>(
    `/api/admin/questions?page=${encodeURIComponent(
      page
    )}&limit=${encodeURIComponent(limit)}${
      search ? `&search=${encodeURIComponent(search)}` : ""
    }${type ? `&type=${encodeURIComponent(type)}` : ""}${
      difficulty ? `&difficulty=${encodeURIComponent(difficulty)}` : ""
    }${status ? `&status=${encodeURIComponent(status)}` : ""}`
  );

  const data = result.data;
  const currentPage = Number(page);

  return (
    <PageShell
      title="Question Bank"
      description="Manage your real backend question bank with search and filters."
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/admin/questions/new"
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Add Question
        </Link>
        <Link
          href="/admin/questions/import"
          className="inline-flex items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Import Questions
        </Link>
      </div>

      <form
        method="GET"
        className="mb-6 grid gap-4 rounded-3xl border bg-white p-5 shadow-sm lg:grid-cols-5"
      >
        <input
          name="search"
          defaultValue={search}
          className="rounded-xl border px-4 py-3"
          placeholder="Search question text, explanation, tag"
        />

        <select
          name="type"
          defaultValue={type}
          className="rounded-xl border px-4 py-3"
        >
          <option value="">All Types</option>
          <option value="SINGLE_CORRECT">Single Correct</option>
          <option value="MULTI_CORRECT">Multi Correct</option>
          <option value="TRUE_FALSE">True / False</option>
          <option value="ASSERTION_REASON">Assertion Reason</option>
          <option value="MATCH_THE_FOLLOWING">Match the Following</option>
        </select>

        <select
          name="difficulty"
          defaultValue={difficulty}
          className="rounded-xl border px-4 py-3"
        >
          <option value="">All Difficulty</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>

        <select
          name="status"
          defaultValue={status}
          className="rounded-xl border px-4 py-3"
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="APPROVED">Approved</option>
          <option value="ACTIVE">Active</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            Apply Filters
          </button>

          <Link
            href="/admin/questions"
            className="rounded-xl border px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Reset
          </Link>
        </div>
      </form>

      {!result.success || !data ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          {result.message}
        </div>
      ) : data.items.length === 0 ? (
        <div className="rounded-3xl border bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            No questions found
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Try changing the filters or add/import fresh questions first.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-xs text-slate-500">Total Questions</div>
              <div className="mt-1 text-xl font-bold text-slate-900">
                {data.total}
              </div>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-xs text-slate-500">Current Page</div>
              <div className="mt-1 text-xl font-bold text-slate-900">
                {data.page}
              </div>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-xs text-slate-500">Page Size</div>
              <div className="mt-1 text-xl font-bold text-slate-900">
                {data.limit}
              </div>
            </div>
          </div>

          <div className="grid gap-5">
            {data.items.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))}
          </div>

          {data.totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-sm text-slate-600">
                Page {data.page} of {data.totalPages}
              </div>

              <div className="flex gap-2">
                {currentPage > 1 ? (
                  <Link
                    href={buildPageHref(resolvedSearchParams, currentPage - 1)}
                    className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="cursor-not-allowed rounded-xl border px-4 py-2 text-sm font-medium text-slate-400">
                    Previous
                  </span>
                )}

                {currentPage < data.totalPages ? (
                  <Link
                    href={buildPageHref(resolvedSearchParams, currentPage + 1)}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="cursor-not-allowed rounded-xl bg-slate-200 px-4 py-2 text-sm font-medium text-slate-500">
                    Next
                  </span>
                )}
              </div>
            </div>
          ) : null}
        </>
      )}
    </PageShell>
  );
}