import { TestBuilderForm } from "@/components/forms/test-builder-form";
import { PageShell } from "@/components/shared/page-shell";

export default function NewTestPage() {
  return (
    <PageShell
      title="Create Test"
      description="Create a real test record using the live admin backend API."
    >
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <TestBuilderForm mode="create" />
      </div>
    </PageShell>
  );
}