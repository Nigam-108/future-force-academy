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

/**
 * Admin batch list page.
 */
export default async function AdminBatchesPage() {
  const result = await fetchInternalApi<BatchListResponse>("/api/admin/batches");
  const data = result.data;

  return (
    <PageShell
      title="Batches"
      description="Manage exam-wise batches and student groupings."
    >
      <div className="space-y-6">
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
            <h2 className="text-xl font-semibold text-slate-900">No batches found</h2>
            <p className="mt-2 text-sm text-slate-600">
              Create your first exam batch to start student grouping.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {data.items.map((batch) => (
              <div
                key={batch.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {batch.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">Slug: {batch.slug}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {batch.description || "No description added."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/admin/batches/${batch.id}/edit`}
                      className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </Link>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-5">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Exam
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {batch.examType}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Status
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {batch.status}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Paid
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {batch.isPaid ? "Yes" : "No"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Students
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {batch._count.studentBatches}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Start
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatDate(batch.startDate)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}