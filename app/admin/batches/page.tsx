import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";

export const dynamic = "force-dynamic";

type BatchListResponse = {
  items: Array<{
    id: string;
    title: string;
    slug: string;
    description: string | null;
    examType: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
    isPaid: boolean;
    createdAt: string;
    _count: {
      studentBatches: number;
    };
    createdBy: {
      fullName: string;
      email: string;
    } | null;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
    new Date(value)
  );
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "DRAFT":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "CLOSED":
      return "bg-slate-100 text-slate-600 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

function examTypeBadgeClass(examType: string) {
  switch (examType) {
    case "GPSC":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "UPSC":
      return "bg-purple-50 text-purple-700 ring-purple-200";
    case "WPSI":
      return "bg-orange-50 text-orange-700 ring-orange-200";
    case "TECHNICAL_OPERATOR":
      return "bg-cyan-50 text-cyan-700 ring-cyan-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

export default async function AdminBatchesPage() {
  const result = await fetchInternalApi<BatchListResponse>("/api/admin/batches");
  const data = result.data;

  return (
    <PageShell
      title="Batches"
      description="Manage exam-wise batches, assign students, and link tests to control access."
    >
      <div className="space-y-6">
        {/* Summary stats */}
        {result.success && data ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Total Batches</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {data.total}
              </p>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Active Batches</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {data.items.filter((b) => b.status === "ACTIVE").length}
              </p>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Total Students Enrolled</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {data.items.reduce((sum, b) => sum + b._count.studentBatches, 0)}
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex justify-end">
          <Link
            href="/admin/batches/new"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Create Batch
          </Link>
        </div>

        {!result.success || !data ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {result.message}
          </div>
        ) : data.items.length === 0 ? (
          <div className="rounded-3xl border border-dashed bg-white p-10 text-center">
            <h2 className="text-xl font-semibold text-slate-900">
              No batches found
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Create your first batch to start grouping students and restricting
              test access.
            </p>
            <Link
              href="/admin/batches/new"
              className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Create First Batch
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {data.items.map((batch) => (
              <div
                key={batch.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span
                        className={`rounded-full px-3 py-1 ring-1 ${examTypeBadgeClass(
                          batch.examType
                        )}`}
                      >
                        {batch.examType}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 ring-1 ${statusBadgeClass(
                          batch.status
                        )}`}
                      >
                        {batch.status}
                      </span>
                      {batch.isPaid ? (
                        <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
                          Paid
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                          Free
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-semibold text-slate-900">
                      {batch.title}
                    </h2>
                    <p className="text-sm text-slate-500">
                      Slug: {batch.slug}
                    </p>
                    {batch.description ? (
                      <p className="max-w-2xl text-sm text-slate-600">
                        {batch.description}
                      </p>
                    ) : null}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/admin/batches/${batch.id}/edit`}
                      className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Edit Batch
                    </Link>
                  </div>
                </div>

                {/* Stats row */}
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Students Enrolled
                    </p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {batch._count.studentBatches}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Start Date
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatDate(batch.startDate)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      End Date
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatDate(batch.endDate)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Created By
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {batch.createdBy?.fullName ?? "—"}
                    </p>
                  </div>
                </div>

                {/* Quick action links */}
                <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                  <p className="w-full text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Quick Actions
                  </p>

                  <Link
                    href={`/admin/students?batchId=${batch.id}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    View Students ({batch._count.studentBatches})
                  </Link>

                  <Link
                    href="/admin/tests"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Manage Test Access
                  </Link>

                  <Link
                    href="/admin/students"
                    className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                  >
                    Assign Students to this Batch
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}