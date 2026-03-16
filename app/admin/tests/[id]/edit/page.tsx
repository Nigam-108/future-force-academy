import { notFound } from "next/navigation";

import {
  TestBuilderForm,
  type TestBuilderFormInitialValues,
} from "@/components/forms/test-builder-form";
import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";

type EditTestPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type AdminTestDetailResponse = TestBuilderFormInitialValues & {
  id: string;
};

export default async function EditTestPage({
  params,
}: EditTestPageProps) {
  const { id } = await params;

  const result = await fetchInternalApi<AdminTestDetailResponse>(
    `/api/admin/tests/${id}`
  );

  if (!result.success && result.status === 404) {
    notFound();
  }

  return (
    <PageShell
      title="Edit Test"
      description="Update a real test using the live admin backend API."
    >
      {!result.success || !result.data ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {result.message}
        </div>
      ) : (
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <TestBuilderForm
            mode="edit"
            testId={id}
            initialValues={result.data}
          />
        </div>
      )}
    </PageShell>
  );
}