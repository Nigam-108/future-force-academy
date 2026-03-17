import Link from "next/link";
import { DeleteTestButton } from "@/components/admin/delete-test-button";
import { DuplicateTestButton } from "@/components/admin/duplicate-test-button";
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

  if (search) {
    params.set("search", search);
  }

  params.set("page", String(nextPage));
  params.set("limit", "12");

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

function truncateText(text: string | null, limit = 180) {
  if (!text?.trim()) {
    return "No description added for this test yet.";
  }

  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit)}...`;
}

function badgeClass(label: TestMode | TestStructureType | TestVisibilityStatus) {
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

function TestCard({ test }: { test: AdminTestsResponse["items"][number] }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 text-xs">
            <span
              className={`rounded-full px-3 py-1 ring-1 ${badgeClass(test.mode)}`}
            >
              {test.mode}
            </span>
            <span
              className={`rounded-full px-3 py-1 ring-1 ${badgeClass(
                test.structureType
              )}`}
            >
              {test.structureType}
            </span>
            <span
              className={`rounded-full px-3 py-1 ring-1 ${badgeClass(
                test.visibilityStatus
              )}`}
            >
              {test.visibilityStatus}
            </span>
          </div>

          <h2 className="text-xl font-semibold text-slate-900">{test.title}</h2>

          <p className="text-sm text-slate-500">Slug: {test.slug}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/admin/tests/${test.id}/questions`}
            className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Manage Questions
          </Link>

          <Link
            href={`/admin/tests/${test.id}/paper`}
            className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            View Paper
          </Link>

          <Link
            href={`/admin/tests/${test.id}/answer-key`}
            className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Answer Key
          </Link>

          <Link
            href={`/admin/tests/${test.id}/edit`}
            className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit
          </Link>

          <DuplicateTestButton testId={test.id} title={test.title} />

          <DeleteTestButton testId={test.id} title={test.title} />
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-600">
        {truncateText(test.description)}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Question Links
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {test._count.testQuestions}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Total Marks
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {test.totalMarks}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Duration
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {test.durationInMinutes ?? "—"} min
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Sections
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {test.sections.length}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Attempts
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {test._count.attempts}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Start Window
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {formatDateTime(test.startAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function AdminTestsPage({
  searchParams,
}: AdminTestsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const page = getSingleValue(resolvedSearchParams.page) || "1";
  const limit = getSingleValue(resolvedSearchParams.limit) || "12";
  const search = getSingleValue(resolvedSearchParams.search) || "";

  const result = await fetchInternalApi<AdminTestsResponse>(
    `/api/admin/tests?page=${encodeURIComponent(
      page
    )}&limit=${encodeURIComponent(limit)}${
      search ? `&search=${encodeURIComponent(search)}` : ""
    }`
  );

  const data = result.data;
  const currentPage = Number(page);

  return (
    <PageShell
      title="Tests"
      description="Manage tests, preview paper and answer key, duplicate, and delete safely."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <form className="flex w-full max-w-2xl gap-3">
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search title, slug or description"
              className="w-full rounded-2xl border px-4 py-3"
            />
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Search
            </button>
          </form>

          <Link
            href="/admin/tests/new"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Create Test
          </Link>
        </div>

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
              Try another search or create a new test.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">Total Tests</p>
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
              {data.items.map((test) => (
                <TestCard key={test.id} test={test} />
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