import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";
import {
  getStudentTests,
  type StudentTestItem,
  type StudentTestMode,
  type StudentTestStatus,
} from "@/lib/server-api";
import { fetchInternalApi } from "@/lib/server-api";

export const dynamic = "force-dynamic";

// ─── Types ───────────────────────────────────────────────────────────────────

type StudentTestsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type AccessSummary = {
  totalAccessibleBatches: number;
  batches: Array<{
    batchId: string;
    batchTitle: string;
    examType: string;
    accessPath: "ADMIN_ASSIGNED" | "PURCHASED" | "BOTH";
  }>;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
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
  if (test.studentStatus === "UPCOMING") return "View schedule";
  if (test.studentStatus === "COMPLETED") return "View summary";
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
  const batchId = getSingleValue(currentSearchParams.batchId);

  if (search) params.set("search", search);
  if (mode) params.set("mode", mode);
  if (studentStatus) params.set("studentStatus", studentStatus);
  if (batchId) params.set("batchId", batchId);

  params.set("page", String(nextPage));
  params.set("limit", "10");

  return `/student/tests?${params.toString()}`;
}

// ─── Test card ────────────────────────────────────────────────────────────────

function TestListCard({ test }: { test: StudentTestItem }) {
  const actualQuestionCount = test._count?.testQuestions ?? test.totalQuestions;
  const sectionCount = test.sections?.length ?? 0;
  const primaryBatch = test.testBatches?.[0];
  const batchColor = primaryBatch?.batch.color ?? null;

  return (
    <article
      className="rounded-3xl border bg-white p-5 shadow-sm overflow-hidden"
      style={
        batchColor
          ? { borderLeft: `4px solid ${batchColor}` }
          : { borderLeft: "4px solid #10b981" }
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            {/* Batch indicator */}
            {primaryBatch ? (
              <span
                className="rounded-full border px-2.5 py-1 font-semibold"
                style={{
                  backgroundColor: `${batchColor}15`,
                  color: batchColor ?? "#6366f1",
                  borderColor: `${batchColor}30`,
                }}
              >
                {primaryBatch.batch.title}
                {(test.testBatches?.length ?? 0) > 1
                  ? ` +${(test.testBatches?.length ?? 1) - 1}`
                  : ""}
              </span>
            ) : (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
                Global
              </span>
            )}

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
            {test.description?.trim() ||
              "No description added for this test yet."}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function StudentTestsPage({
  searchParams,
}: StudentTestsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};

  const page = getSingleValue(resolvedSearchParams.page) || "1";
  const limit = getSingleValue(resolvedSearchParams.limit) || "10";
    const search = getSingleValue(resolvedSearchParams.search) || "";
  const mode = getSingleValue(resolvedSearchParams.mode) || "";
  const studentStatus = getSingleValue(resolvedSearchParams.studentStatus) || "";
  const batchId = getSingleValue(resolvedSearchParams.batchId) || "";

  const [result, accessResult] = await Promise.all([
          getStudentTests({
        page,
        limit,
        search,
        mode: mode as StudentTestMode | "",
        studentStatus: studentStatus as StudentTestStatus | "",
        batchId,
      }),
    fetchInternalApi<AccessSummary>("/api/student/access"),
  ]);

  const data = result.data;
  const access = accessResult.data;
  const currentPage = Number(page);

  return (
    <PageShell
      title="Tests"
      description="Browse your available tests based on your batch enrollments."
    >
      {/* ── Enrollment summary banner ── */}
      {access && access.totalAccessibleBatches > 0 ? (
        <div className="mb-6 rounded-3xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-blue-900">
                You are enrolled in {access.totalAccessibleBatches} active batch
                {access.totalAccessibleBatches !== 1 ? "es" : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {access.batches.map((b) => (
                  <span
                    key={b.batchId}
                    className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
                    title={
                      b.accessPath === "PURCHASED"
                        ? "Access via purchase"
                        : b.accessPath === "ADMIN_ASSIGNED"
                        ? "Access via admin assignment"
                        : "Access via purchase + assignment"
                    }
                  >
                    {b.batchTitle}
                    {b.accessPath === "PURCHASED" ? " 🎫" : " ✓"}
                  </span>
                ))}
              </div>
            </div>
            <Link
              href="/student/purchases"
              className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
            >
              View Enrollments
            </Link>
          </div>
        </div>
      ) : null}

            {batchId ? (
        <div className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          Showing tests for the selected batch only.
          <Link
            href="/student/tests"
            className="ml-2 font-semibold underline underline-offset-2"
          >
            Clear batch filter
          </Link>
        </div>
      ) : null}

      {/* ── Filter bar ── */}
      <form
        method="GET"
        className="mb-6 grid gap-4 rounded-3xl border bg-white p-5 shadow-sm lg:grid-cols-4"
      >
        <input
          name="search"
          defaultValue={search}
          className="rounded-xl border px-4 py-3 text-sm"
          placeholder="Search by test name"
        />

        <select
          name="mode"
          defaultValue={mode}
          className="rounded-xl border px-4 py-3 text-sm text-slate-700"
        >
          <option value="">All Modes</option>
          <option value="PRACTICE">Practice</option>
          <option value="LIVE">Live</option>
          <option value="ASSIGNED">Assigned</option>
        </select>

        <select
          name="studentStatus"
          defaultValue={studentStatus}
          className="rounded-xl border px-4 py-3 text-sm text-slate-700"
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

      {/* ── Results ── */}
      {!result.success || !data ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          {result.message}
        </div>
      ) : data.items.length === 0 ? (
        <div className="rounded-3xl border bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            No tests available
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {access && access.totalAccessibleBatches === 0
              ? "You are not enrolled in any batches yet. Contact your admin to get access."
              : "No tests match your current filters. Try resetting the filters."}
          </p>
          {access && access.totalAccessibleBatches === 0 ? (
            <Link
              href="/student/purchases"
              className="mt-5 inline-flex rounded-xl border px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              View Enrollments
            </Link>
          ) : (
            <Link
              href="/student/tests"
              className="mt-5 inline-flex rounded-xl border px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Reset Filters
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              {data.total} test{data.total !== 1 ? "s" : ""} available
            </p>
          </div>

          <div className="grid gap-6">
            {data.items.map((test) => (
              <TestListCard key={test.id} test={test} />
            ))}
          </div>

          {/* Pagination */}
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