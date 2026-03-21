import Link from "next/link";
import {
  BarChart2,
  ClipboardList,
  Eye,
  GitBranch,
  KeyRound,
  Pencil,
  Globe,
} from "lucide-react";
import { DeleteTestButton } from "@/components/admin/delete-test-button";
import { DuplicateTestButton } from "@/components/admin/duplicate-test-button";
import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";

// ─── Types ─────────────────────────────────────────────────────────────────

type AdminTestsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type TestMode = "PRACTICE" | "LIVE" | "ASSIGNED";
type TestStructureType = "SINGLE" | "SECTIONAL";
type TestVisibilityStatus = "DRAFT" | "LIVE" | "CLOSED";

type TestBatchItem = {
  id: string;
  batch: {
    id: string;
    title: string;
    slug: string;
    examType: string;
    status: string;
    isPaid: boolean;
  };
};

type AdminTestItem = {
  id: string;
  createdById: string | null;
  title: string;
  slug: string;
  description: string | null;
  mode: TestMode;
  structureType: TestStructureType;
  visibilityStatus: TestVisibilityStatus;
  totalQuestions: number;
  totalMarks: number;
  durationInMinutes: number | null;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  sections: Array<{
    id: string;
    title: string;
    displayOrder: number;
    totalQuestions: number;
    durationInMinutes: number | null;
    positiveMarks: number | null;
    negativeMarks: number | null;
  }>;
  testBatches: TestBatchItem[];
  _count: {
    testQuestions: number;
    attempts: number;
  };
};

type AdminTestsResponse = {
  items: AdminTestItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type BatchOption = {
  id: string;
  title: string;
  examType: string;
  status: string;
};

type BatchOptionsResponse = BatchOption[];

// ─── Helpers ───────────────────────────────────────────────────────────────

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildPageHref(
  currentSearchParams: Record<string, string | string[] | undefined>,
  nextPage: number
) {
  const params = new URLSearchParams();
  const search = getSingleValue(currentSearchParams.search);
  const mode = getSingleValue(currentSearchParams.mode);
  const visibilityStatus = getSingleValue(currentSearchParams.visibilityStatus);
  const batchId = getSingleValue(currentSearchParams.batchId);

  if (search) params.set("search", search);
  if (mode) params.set("mode", mode);
  if (visibilityStatus) params.set("visibilityStatus", visibilityStatus);
  if (batchId) params.set("batchId", batchId);
  params.set("page", String(nextPage));
  params.set("limit", "12");

  return `/admin/tests?${params.toString()}`;
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function truncateText(text: string | null, limit = 180) {
  if (!text?.trim()) return "No description added for this test yet.";
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}...`;
}

function badgeClass(
  label: TestMode | TestStructureType | TestVisibilityStatus
) {
  switch (label) {
    case "LIVE":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "DRAFT":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "CLOSED":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    case "ASSIGNED":
      return "bg-indigo-50 text-indigo-700 ring-indigo-200";
    case "PRACTICE":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    case "SECTIONAL":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "SINGLE":
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

/**
 * Returns card border + accent color based on what batches a test is linked to.
 * If multiple exam types are linked, uses a mixed/multi color.
 */
function getBatchColorScheme(testBatches: TestBatchItem[]): {
  border: string;
  badge: string;
  dot: string;
  label: string;
} {
  if (testBatches.length === 0) {
    return {
      border: "border-l-4 border-l-emerald-400",
      badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      dot: "bg-emerald-400",
      label: "Global",
    };
  }

  const examTypes = [...new Set(testBatches.map((tb) => tb.batch.examType))];

  // Multiple different exam types
  if (examTypes.length > 1) {
    return {
      border: "border-l-4 border-l-pink-400",
      badge: "bg-pink-50 text-pink-700 ring-pink-200",
      dot: "bg-pink-400",
      label: `${testBatches.length} batches`,
    };
  }

  const examType = examTypes[0];

  switch (examType) {
    case "GPSC":
      return {
        border: "border-l-4 border-l-blue-400",
        badge: "bg-blue-50 text-blue-700 ring-blue-200",
        dot: "bg-blue-400",
        label: `GPSC · ${testBatches.length} batch${testBatches.length !== 1 ? "es" : ""}`,
      };
    case "UPSC":
      return {
        border: "border-l-4 border-l-purple-400",
        badge: "bg-purple-50 text-purple-700 ring-purple-200",
        dot: "bg-purple-400",
        label: `UPSC · ${testBatches.length} batch${testBatches.length !== 1 ? "es" : ""}`,
      };
    case "WPSI":
      return {
        border: "border-l-4 border-l-orange-400",
        badge: "bg-orange-50 text-orange-700 ring-orange-200",
        dot: "bg-orange-400",
        label: `WPSI · ${testBatches.length} batch${testBatches.length !== 1 ? "es" : ""}`,
      };
    case "TECHNICAL_OPERATOR":
      return {
        border: "border-l-4 border-l-cyan-400",
        badge: "bg-cyan-50 text-cyan-700 ring-cyan-200",
        dot: "bg-cyan-400",
        label: `Tech · ${testBatches.length} batch${testBatches.length !== 1 ? "es" : ""}`,
      };
    default:
      return {
        border: "border-l-4 border-l-slate-400",
        badge: "bg-slate-100 text-slate-600 ring-slate-200",
        dot: "bg-slate-400",
        label: `${testBatches.length} batch${testBatches.length !== 1 ? "es" : ""}`,
      };
  }
}

// ─── TestCard component ─────────────────────────────────────────────────────

function TestCard({ test }: { test: AdminTestItem }) {
  const colorScheme = getBatchColorScheme(test.testBatches);

  return (
    <div
      className={`rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden ${colorScheme.border}`}
    >
      <div className="p-5">
        {/* Top row: badges + title + actions */}
        <div className="flex flex-wrap items-start justify-between gap-3">

          {/* Left — badges + title */}
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex flex-wrap gap-1.5 text-xs">
              {/* Batch color badge */}
              <span
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${colorScheme.badge}`}
              >
                {test.testBatches.length === 0 ? (
                  <Globe size={11} />
                ) : (
                  <span className={`h-1.5 w-1.5 rounded-full ${colorScheme.dot}`} />
                )}
                {colorScheme.label}
              </span>

              <span className={`rounded-full px-2.5 py-1 ring-1 ${badgeClass(test.mode)}`}>
                {test.mode}
              </span>
              <span className={`rounded-full px-2.5 py-1 ring-1 ${badgeClass(test.structureType)}`}>
                {test.structureType}
              </span>
              <span className={`rounded-full px-2.5 py-1 ring-1 ${badgeClass(test.visibilityStatus)}`}>
                {test.visibilityStatus}
              </span>
            </div>

            <h2 className="text-lg font-semibold text-slate-900 leading-snug">
              {test.title}
            </h2>

            {/* Batch names — compact pills */}
            {test.testBatches.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {test.testBatches.slice(0, 3).map((tb) => (
                  <Link
                    key={tb.id}
                    href={`/admin/tests?batchId=${tb.batch.id}`}
                    className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500 hover:bg-slate-200 transition-colors"
                    title={`Filter tests in ${tb.batch.title}`}
                  >
                    {tb.batch.title}
                  </Link>
                ))}
                {test.testBatches.length > 3 ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-400">
                    +{test.testBatches.length - 3} more
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Right — action buttons */}
          <div className="flex shrink-0 flex-col items-end gap-2">
            {/* Icon pill */}
            <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
              <Link
                href={`/admin/tests/${test.id}/questions`}
                title="Manage Questions"
                className="group relative flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-indigo-100 hover:text-indigo-700"
              >
                <ClipboardList size={15} />
                <span className="pointer-events-none absolute -bottom-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  Questions
                </span>
              </Link>

              <Link
                href={`/admin/tests/${test.id}/batches`}
                title="Assign Batches"
                className="group relative flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-blue-100 hover:text-blue-700"
              >
                <GitBranch size={15} />
                <span className="pointer-events-none absolute -bottom-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  Batches
                </span>
              </Link>

              <Link
                href={`/admin/tests/${test.id}/paper`}
                title="View Paper"
                className="group relative flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-violet-100 hover:text-violet-700"
              >
                <Eye size={15} />
                <span className="pointer-events-none absolute -bottom-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  Paper
                </span>
              </Link>

              <Link
                href={`/admin/tests/${test.id}/answer-key`}
                title="Answer Key"
                className="group relative flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-amber-100 hover:text-amber-700"
              >
                <KeyRound size={15} />
                <span className="pointer-events-none absolute -bottom-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  Answer Key
                </span>
              </Link>

              <Link
                href={`/admin/tests/${test.id}/analytics`}
                title="Analytics"
                className="group relative flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-emerald-100 hover:text-emerald-700"
              >
                <BarChart2 size={15} />
                <span className="pointer-events-none absolute -bottom-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  Analytics
                </span>
              </Link>

              <Link
                href={`/admin/tests/${test.id}/edit`}
                title="Edit Test"
                className="group relative flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
              >
                <Pencil size={15} />
                <span className="pointer-events-none absolute -bottom-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  Edit
                </span>
              </Link>
            </div>

            {/* Complex actions */}
            <div className="flex items-center gap-2">
              <DuplicateTestButton testId={test.id} title={test.title} />
              <DeleteTestButton testId={test.id} title={test.title} />
            </div>
          </div>
        </div>

        {/* Stats row — compact */}
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Qs</p>
            <p className="mt-0.5 text-base font-semibold text-slate-900">
              {test._count.testQuestions}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Marks</p>
            <p className="mt-0.5 text-base font-semibold text-slate-900">
              {test.totalMarks}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Mins</p>
            <p className="mt-0.5 text-base font-semibold text-slate-900">
              {test.durationInMinutes ?? "—"}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Sections</p>
            <p className="mt-0.5 text-base font-semibold text-slate-900">
              {test.sections.length}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Attempts</p>
            <p className="mt-0.5 text-base font-semibold text-slate-900">
              {test._count.attempts}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Start</p>
            <p className="mt-0.5 text-xs font-medium text-slate-900">
              {test.startAt
                ? new Intl.DateTimeFormat("en-IN", { dateStyle: "short" }).format(
                    new Date(test.startAt)
                  )
                : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function AdminTestsPage({
  searchParams,
}: AdminTestsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const page = getSingleValue(resolvedSearchParams.page) || "1";
  const limit = getSingleValue(resolvedSearchParams.limit) || "12";
  const search = getSingleValue(resolvedSearchParams.search) || "";
  const mode = getSingleValue(resolvedSearchParams.mode) || "";
  const visibilityStatus =
    getSingleValue(resolvedSearchParams.visibilityStatus) || "";
  const batchId = getSingleValue(resolvedSearchParams.batchId) || "";

  // Build API query string
  const apiParams = new URLSearchParams();
  apiParams.set("page", page);
  apiParams.set("limit", limit);
  if (search) apiParams.set("search", search);
  if (mode) apiParams.set("mode", mode);
  if (visibilityStatus) apiParams.set("visibilityStatus", visibilityStatus);
  if (batchId) apiParams.set("batchId", batchId);

  // Fetch tests + batch options in parallel
  const [result, batchOptionsResult] = await Promise.all([
    fetchInternalApi<AdminTestsResponse>(
      `/api/admin/tests?${apiParams.toString()}`
    ),
    fetchInternalApi<BatchOptionsResponse>("/api/admin/batches/options"),
  ]);

  const data = result.data;
  const batchOptions = batchOptionsResult.data ?? [];
  const currentPage = Number(page);

  // Find selected batch title for display
  const selectedBatch = batchId
    ? batchOptions.find((b) => b.id === batchId)
    : null;

  return (
    <PageShell
      title="Tests"
      description="Manage tests, assign batches, preview papers, review analytics, duplicate, and delete safely."
    >
      <div className="space-y-6">

        {/* ── Filter bar ── */}
        <form method="GET" className="rounded-3xl border bg-white p-5 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto_auto]">
            {/* Search */}
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search title, slug or description"
              className="w-full rounded-xl border px-4 py-3 text-sm"
            />

            {/* Mode filter */}
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

            {/* Visibility filter */}
            <select
              name="visibilityStatus"
              defaultValue={visibilityStatus}
              className="rounded-xl border px-4 py-3 text-sm text-slate-700"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="LIVE">Live</option>
              <option value="CLOSED">Closed</option>
            </select>

            {/* Batch filter */}
            <select
              name="batchId"
              defaultValue={batchId}
              className="rounded-xl border px-4 py-3 text-sm text-slate-700"
            >
              <option value="">All Batches</option>
              {batchOptions.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.title} ({batch.examType})
                </option>
              ))}
            </select>

            {/* Submit */}
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Apply
            </button>
          </div>

          {/* Active filter indicators + reset */}
          {(search || mode || visibilityStatus || batchId) ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                Active filters:
              </span>

              {search ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                  Search: &quot;{search}&quot;
                </span>
              ) : null}

              {mode ? (
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs text-violet-700 ring-1 ring-violet-200">
                  Mode: {mode}
                </span>
              ) : null}

              {visibilityStatus ? (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700 ring-1 ring-amber-200">
                  Status: {visibilityStatus}
                </span>
              ) : null}

              {selectedBatch ? (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700 ring-1 ring-blue-200">
                  Batch: {selectedBatch.title}
                </span>
              ) : null}

              <Link
                href="/admin/tests"
                className="ml-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
              >
                Clear all filters
              </Link>
            </div>
          ) : null}
        </form>

        {/* ── Create button + header ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-600">
            {selectedBatch ? (
              <span>
                Showing tests in{" "}
                <span className="font-semibold text-slate-900">
                  {selectedBatch.title}
                </span>
              </span>
            ) : null}
          </div>

          <Link
            href="/admin/tests/new"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Create Test
          </Link>
        </div>

        {/* ── Results ── */}
        {!result.success || !data ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {result.message}
          </div>
        ) : data.items.length === 0 ? (
          <div className="rounded-3xl border border-dashed bg-white p-10 text-center">
            <h2 className="text-xl font-semibold text-slate-900">
              No tests found
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {batchId
                ? "No tests are assigned to this batch yet. Use the Assign Batches button on any test."
                : "Try different filters or create a new test."}
            </p>
            {batchId ? (
              <Link
                href="/admin/tests"
                className="mt-5 inline-flex rounded-xl border px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                View all tests
              </Link>
            ) : null}
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">
                  {batchId ? "Tests in Batch" : "Total Tests"}
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {data.total}
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">Global Tests</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {data.items.filter((t) => t.testBatches.length === 0).length}
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">Batch-Restricted</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {data.items.filter((t) => t.testBatches.length > 0).length}
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">Page</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {data.page} / {data.totalPages}
                </p>
              </div>
            </div>

            {/* Test cards */}
            <div className="space-y-4">
              {data.items.map((test) => (
                <TestCard key={test.id} test={test} />
              ))}
            </div>

            {/* Pagination */}
            {data.totalPages > 1 ? (
              <div className="flex items-center justify-between rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm">
                <p className="text-slate-600">
                  Page {data.page} of {data.totalPages} — {data.total} tests
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