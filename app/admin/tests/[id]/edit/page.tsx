import { TestBuilderStepper } from "@/components/admin/test-builder-stepper";
import { TestBuilderForm } from "@/components/forms/test-builder-form";
import { PageShell } from "@/components/shared/page-shell";

export default function EditTestPage() {
  return (
    <PageShell title="Edit Test" description="Update test settings, questions, timing, and publish rules.">
      <div className="space-y-6">
        <TestBuilderStepper />
        <TestBuilderForm />
      </div>
    </PageShell>
  );
}
