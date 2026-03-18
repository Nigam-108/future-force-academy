import Link from "next/link";
import { notFound } from "next/navigation";
import { TestBatchAssignmentClient } from "@/components/admin/test-batch-assignment-client";
import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";

type PageProps = {
  params: Promise<{ id: string }>;
};

type TestDetailResponse = {
  id: string;
  title: string;
};

export default async function TestBatchAssignmentPage({ params }: PageProps) {
  const { id } = await params;

  const result = await fetchInternalApi<TestDetailResponse>(
    `/api/admin/tests/${id}`
  );

  if (!result.success && result.status === 404) {
    notFound();
  }

  return (
    <PageShell
      title="Batch Assignment"
      description="Control which student batches can access this test."
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/admin/tests"
          className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to Tests
        </Link>

        <Link
          href={`/admin/tests/${id}/edit`}
          className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Edit Test
        </Link>

        <Link
          href={`/admin/tests/${id}/questions`}
          className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Manage Questions
        </Link>
      </div>

      {!result.success || !result.data ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {result.message}
        </div>
      ) : (
        <TestBatchAssignmentClient
          testId={result.data.id}
          testTitle={result.data.title}
        />
      )}
    </PageShell>
  );
}