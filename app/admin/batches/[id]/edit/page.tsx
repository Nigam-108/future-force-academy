import { notFound } from "next/navigation";
import {
  BatchForm,
  type BatchFormInitialValues,
} from "@/components/forms/batch-form";
import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";

type EditBatchPageProps = {
  params: Promise<{ id: string }>;
};

type BatchDetailResponse = BatchFormInitialValues & {
  id: string;
};

export default async function EditBatchPage({
  params,
}: EditBatchPageProps) {
  const { id } = await params;

  const result = await fetchInternalApi<BatchDetailResponse>(
    `/api/admin/batches/${id}`
  );

  if (!result.success && result.status === 404) {
    notFound();
  }

  return (
    <PageShell
      title="Edit Batch"
      description="Update batch details, exam type, dates, and paid/free status."
    >
      {!result.success || !result.data ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {result.message}
        </div>
      ) : (
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <BatchForm
            mode="edit"
            batchId={id}
            initialValues={result.data}
          />
        </div>
      )}
    </PageShell>
  );
}