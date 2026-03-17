import { BatchForm } from "@/components/forms/batch-form";
import { PageShell } from "@/components/shared/page-shell";

export default function NewBatchPage() {
  return (
    <PageShell
      title="Create Batch"
      description="Create an exam-wise batch for student grouping and future access control."
    >
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <BatchForm mode="create" />
      </div>
    </PageShell>
  );
}