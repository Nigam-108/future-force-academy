import Link from "next/link";
import { DeleteQuestionButton } from "@/components/admin/delete-question-button";
import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";

export const dynamic = "force-dynamic";

type QuestionsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type AdminQuestionsResponse = {
  items: Array<{
    id: string;
    questionText: string;
    optionA: string | null;
    optionB: string | null;
    optionC: string | null;
    optionD: string | null;
    correctAnswer: string | null;
    explanation: string | null;
    createdAt: string;
    updatedAt: string;
    createdBy: {
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

/**
 * Builds pagination link while preserving current search query.
 */
function buildPageHref(
  currentSearchParams: Record<string, string | string[] | undefined>,
  nextPage: number
) {
  const params = new URLSearchParams();
  const search = getSingleValue(currentSearchParams.search);

  if (search) {
    params.set("search", search);
  }

  params.set("page", String(nextPage));
  params.set("limit", "20");

  return `/admin/questions?${params.toString()}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function truncateText(text: string, limit = 220) {
  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit)}...`;
}

/**
 * Single reusable card component for each question row.
 */
function QuestionCard({
  question,
}: {
  question: AdminQuestionsResponse["items"][number];
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">
            {truncateText(question.questionText)}
          </h2>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              Correct: {question.correctAnswer || "—"}
            </span>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-700">
              Updated: {formatDateTime(question.updatedAt)}
            </span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
              By: {question.createdBy?.fullName || "—"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/admin/questions/${question.id}/edit`}
            className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit
          </Link>

          <DeleteQuestionButton
            questionId={question.id}
            questionText={question.questionText}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Options</p>
          <div className="mt-2 space-y-1">
            <p>A. {question.optionA || "—"}</p>
            <p>B. {question.optionB || "—"}</p>
            <p>C. {question.optionC || "—"}</p>
            <p>D. {question.optionD || "—"}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Explanation</p>
          <p className="mt-2">
            {question.explanation?.trim() || "No explanation added."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function QuestionsPage({
  searchParams,
}: QuestionsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const page = getSingleValue(resolvedSearchParams.page) || "1";
  const limit = getSingleValue(resolvedSearchParams.limit) || "20";
  const search = getSingleValue(resolvedSearchParams.search) || "";

  const result = await fetchInternalApi<AdminQuestionsResponse>(
    `/api/admin/questions?page=${encodeURIComponent(
      page
    )}&limit=${encodeURIComponent(limit)}${
      search ? `&search=${encodeURIComponent(search)}` : ""
    }`
  );

  const data = result.data;
  const currentPage = Number(page);

  return (
    <PageShell
      title="Question Bank"
      description="Minimal question list with fast add, bulk import, edit and safe delete actions."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <form className="flex w-full max-w-2xl gap-3">
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search question text"
              className="w-full rounded-2xl border px-4 py-3"
            />
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/questions/import"
              className="rounded-xl border px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Bulk Import
            </Link>

            <Link
              href="/admin/questions/new"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Add Question
            </Link>
          </div>
        </div>

        {!result.success || !data ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {result.message}
          </div>
        ) : data.items.length === 0 ? (
          <div className="rounded-3xl border border-dashed bg-white p-10 text-center">
            <h2 className="text-xl font-semibold text-slate-900">
              No questions found
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Try another search, add fresh questions, or use bulk import.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">Total Questions</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {data.total}
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">Current Page</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {data.page}
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">Visible On Page</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {data.items.length}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {data.items.map((question) => (
                <QuestionCard key={question.id} question={question} />
              ))}
            </div>

            {data.totalPages > 1 ? (
              <div className="flex items-center justify-between rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm">
                <p className="text-slate-600">
                  Page {data.page} of {data.totalPages}
                </p>

                <div className="flex gap-3">
                  {currentPage > 1 ? (
                    <Link
                      href={buildPageHref(resolvedSearchParams, currentPage - 1)}
                      className="rounded-xl border px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Previous
                    </Link>
                  ) : (
                    <span className="rounded-xl border px-4 py-2 text-slate-400">
                      Previous
                    </span>
                  )}

                  {currentPage < data.totalPages ? (
                    <Link
                      href={buildPageHref(resolvedSearchParams, currentPage + 1)}
                      className="rounded-xl border px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Next
                    </Link>
                  ) : (
                    <span className="rounded-xl border px-4 py-2 text-slate-400">
                      Next
                    </span>
                  )}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </PageShell>
  );
}