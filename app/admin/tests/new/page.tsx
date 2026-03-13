import { TestBuilderStepper } from "@/components/admin/test-builder-stepper";
import { TestBuilderForm } from "@/components/forms/test-builder-form";
import { PageShell } from "@/components/shared/page-shell";

export default function NewTestPage() {
  return (
    <PageShell title="Create Test" description="Use the structured builder to create a new single or sectional test.">
      <div className="space-y-6">
        <TestBuilderStepper />
        <TestBuilderForm />
      </div>
    </PageShell>
  );
}
