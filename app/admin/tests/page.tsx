import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";

export const dynamic = "force-dynamic";

type AdminTestsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type TestMode = "PRACTICE" | "LIVE" | "ASSIGNED";
type TestStructureType = "SINGLE" | "SECTIONAL";
type TestVisibilityStatus = "DRAFT" | "LIVE" | "CLOSED";

type AdminTestsResponse = {
  items: Array<{
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
      createdAt: string;
      updatedAt: string;
    }>;
    _count: {
      testQuestions: number;
      attempts: number;
    };
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
  const mode = getSingleValue(currentSearchParams.mode);
  const structureType = getSingleValue(currentSearchParams.structureType);
  const visibilityStatus = getSingleValue(currentSearchParams.visibilityStatus);

  if (search) params.set("search", search);
  if (mode) params.set("mode", mode);
  if (structureType) params.set("structureType", structureType);
  if (visibilityStatus) params.set("visibilityStatus", visibilityStatus);

  params.set("page", String(nextPage));
  params.set("limit", "10");

  return `/admin/tests?${params.toString()}`;
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

function modeBadgeClass(mode: TestMode) {
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

function visibilityBadgeClass(status: TestVisibilityStatus) {
  switch (status) {
    case "LIVE":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "DRAFT":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "CLOSED":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function structureBadgeClass(type: TestStructureType) {
  return type === "SECTIONAL"
    ? "bg-sky-50 text-sky-700 ring-sky-200"
    : "bg-slate-100 text-slate-700 ring-slate-200";
}

function truncateText(text: string | null, limit = 180) {
  if (!text?.trim()) {
    return "No description added for this test yet.";
  }

  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit)}...`;
}

function TestCard({ test }: { test: AdminTestsResponse["items"][number] }) {
  return (
    <article className="rounded-3xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <span
              className={`rounded-full px-3 py-1 ring-1 ${modeBadgeClass(
                test.mode
              )}`}
            >
              {test.mode}
            </span>

            <span
              className={`rounded-full px-3 py-1 ring-1 ${visibilityBadgeClass(
                test.visibilityStatus
              )}`}
            >
              {test.visibilityStatus}
            </span>

            <span
              className={`rounded-full px-3 py-1 ring-1 ${structureBadgeClass(
                test.structureType
              )}`}
            >
              {test.structureType}
            </span>
          </div>

          <h2 className="text-lg font-semibold text-slate-900">{test.title}</h2>
          <p className="text-sm text-slate-500">Slug: {test.slug}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/tests/${test.id}/edit`}
            className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit
          </Link>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">
        {truncateText(test.description)}
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Question Links</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {test._count.testQuestions}
          </div>
        </div>

        <div className="rounded-2xl border bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Total Marks</div>
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
            {test.sections.length}
          </div>
        </div>

        <div className="rounded-2xl border bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Attempts</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {test._count.attempts}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Start Window</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {formatDateTime(test.startAt)}
          </div>
        </div>

        <div className="rounded-2xl border bg-slate-50 p-3">
          <div className="text-xs text-slate-500">End Window</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {formatDateTime(test.endAt)}
          </div>
        </div>
      </div>
    </article>
  );
}

export default async function AdminTestsPage({
  searchParams,
}: AdminTestsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};

  const page = getSingleValue(resolvedSearchParams.page) || "1";
  const limit = getSingleValue(resolvedSearchParams.limit) || "10";
  const search = getSingleValue(resolvedSearchParams.search) || "";
  const mode = getSingleValue(resolvedSearchParams.mode) || "";
  const structureType = getSingleValue(resolvedSearchParams.structureType) || "";
  const visibilityStatus =
    getSingleValue(resolvedSearchParams.visibilityStatus) || "";

  const result = await fetchInternalApi<AdminTestsResponse>(
    `/api/admin/tests?page=${encodeURIComponent(
      page
    )}&limit=${encodeURIComponent(limit)}${
      search ? `&search=${encodeURIComponent(search)}` : ""
    }${mode ? `&mode=${encodeURIComponent(mode)}` : ""}${
      structureType ? `&structureType=${encodeURIComponent(structureType)}` : ""
    }${
      visibilityStatus
        ? `&visibilityStatus=${encodeURIComponent(visibilityStatus)}`
        : ""
    }`
  );

  const data = result.data;
  const currentPage = Number(page);

  return (
    <PageShell
      title="Tests"
      description="Browse and manage real test records from the admin backend."
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/admin/tests/new"
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Create Test
        </Link>
        <Link
          href="/admin/tests/templates"
          className="inline-flex items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          View Templates
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
          placeholder="Search title, slug, description"
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
          name="structureType"
          defaultValue={structureType}
          className="rounded-xl border px-4 py-3"
        >
          <option value="">All Structures</option>
          <option value="SINGLE">Single</option>
          <option value="SECTIONAL">Sectional</option>
        </select>

        <select
          name="visibilityStatus"
          defaultValue={visibilityStatus}
          className="rounded-xl border px-4 py-3"
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="LIVE">Live</option>
          <option value="CLOSED">Closed</option>
        </select>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            Apply Filters
          </button>

          <Link
            href="/admin/tests"
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
            Try changing the filters or create a new test first.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-xs text-slate-500">Total Tests</div>
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
              <div className="text-xs text-slate-500">Visible On Page</div>
              <div className="mt-1 text-xl font-bold text-slate-900">
                {data.items.length}
              </div>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-xs text-slate-500">Total Pages</div>
              <div className="mt-1 text-xl font-bold text-slate-900">
                {data.totalPages}
              </div>
            </div>
          </div>

          <div className="grid gap-5">
            {data.items.map((test) => (
              <TestCard key={test.id} test={test} />
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