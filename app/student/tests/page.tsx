import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import {
  getStudentTests,
  type StudentTestItem,
  type StudentTestMode,
  type StudentTestStatus,
} from "@/lib/server-api";

export const dynamic = "force-dynamic";

type StudentTestsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusBadgeClasses(status: StudentTestStatus) {
  switch (status) {
    case "AVAILABLE":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "UPCOMING":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "LIVE":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "COMPLETED":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function getModeBadgeClasses(mode: StudentTestMode) {
  switch (mode) {
    case "LIVE":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    case "ASSIGNED":
      return "bg-indigo-50 text-indigo-700 ring-indigo-200";
    case "PRACTICE":
    default:
      return "bg-violet-50 text-violet-700 ring-violet-200";
  }
}

function getActionLabel(test: StudentTestItem) {
  if (test.studentStatus === "UPCOMING") {
    return "View schedule";
  }

  if (test.studentStatus === "COMPLETED") {
    return "View summary";
  }

  return "View instructions";
}

function buildPageHref(
  currentSearchParams: Record<string, string | string[] | undefined>,
  nextPage: number
) {
  const params = new URLSearchParams();

  const search = getSingleValue(currentSearchParams.search);
  const mode = getSingleValue(currentSearchParams.mode);
  const studentStatus = getSingleValue(currentSearchParams.studentStatus);

  if (search) params.set("search", search);
  if (mode) params.set("mode", mode);
  if (studentStatus) params.set("studentStatus", studentStatus);

  params.set("page", String(nextPage));
  params.set("limit", "10");

  return `/student/tests?${params.toString()}`;
}

function TestListCard({ test }: { test: StudentTestItem }) {
  const actualQuestionCount = test._count?.testQuestions ?? test.totalQuestions;
  const sectionCount = test.sections?.length ?? 0;

  return (
    <article className="rounded-3xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <span
              className={`rounded-full px-3 py-1 ring-1 ${getModeBadgeClasses(
                test.mode
              )}`}
            >
              {test.mode}
            </span>

            <span
              className={`rounded-full px-3 py-1 ring-1 ${getStatusBadgeClasses(
                test.studentStatus
              )}`}
            >
              {test.studentStatus}
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 ring-1 ring-slate-200">
              {test.structureType}
            </span>
          </div>

          <h2 className="text-lg font-semibold text-slate-900">{test.title}</h2>

          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            {test.description?.trim() || "No description added for this test yet."}
          </p>
        </div>

        <Link
          href={`/student/tests/${test.id}/instructions`}
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {getActionLabel(test)}
        </Link>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Questions</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {actualQuestionCount}
          </div>
        </div>

        <div className="rounded-2xl border bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Marks</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {test.totalMarks}
          </div>
        </div>

        <div className="rounded-2xl border bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Duration</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {test.durationInMinutes ?? "—"} min
          </div>
        </div>

        <div className="rounded-2xl border bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Sections</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {sectionCount}
          </div>
        </div>

        <div className="rounded-2xl border bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Start Window</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {formatDateTime(test.startAt)}
          </div>
        </div>
      </div>
    </article>
  );
}

export default async function StudentTestsPage({
  searchParams,
}: StudentTestsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};

  const page = getSingleValue(resolvedSearchParams.page) || "1";
  const limit = getSingleValue(resolvedSearchParams.limit) || "10";
  const search = getSingleValue(resolvedSearchParams.search) || "";
  const mode = getSingleValue(resolvedSearchParams.mode) || "";
  const studentStatus =
    getSingleValue(resolvedSearchParams.studentStatus) || "";

  const result = await getStudentTests({
    page,
    limit,
    search,
    mode: mode as StudentTestMode | "",
    studentStatus: studentStatus as StudentTestStatus | "",
  });

  const data = result.data;
  const currentPage = Number(page);

  return (
    <PageShell
      title="Tests"
      description="Browse your real student-visible tests, filter them by mode or status, and open the instructions page before starting."
    >
      <form
        method="GET"
        className="mb-6 grid gap-4 rounded-3xl border bg-white p-5 shadow-sm lg:grid-cols-4"
      >
        <input
          name="search"
          defaultValue={search}
          className="rounded-xl border px-4 py-3"
          placeholder="Search by test name"
        />

        <select
          name="mode"
          defaultValue={mode}
          className="rounded-xl border px-4 py-3"
        >
          <option value="">All Modes</option>
          <option value="PRACTICE">Practice</option>
          <option value="LIVE">Live</option>
          <option value="ASSIGNED">Assigned</option>
        </select>

        <select
          name="studentStatus"
          defaultValue={studentStatus}
          className="rounded-xl border px-4 py-3"
        >
          <option value="">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="UPCOMING">Upcoming</option>
          <option value="LIVE">Live</option>
          <option value="COMPLETED">Completed</option>
        </select>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            Apply Filters
          </button>

          <Link
            href="/student/tests"
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
          <h2 className="text-lg font-semibold text-slate-900">No tests found</h2>
          <p className="mt-2 text-sm text-slate-600">
            Try changing the filters, or make sure at least one test is visible to
            students in the database.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-6">
            {data.items.map((test) => (
              <TestListCard key={test.id} test={test} />
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