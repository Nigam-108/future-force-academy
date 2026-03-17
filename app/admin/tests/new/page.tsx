import { TestForm } from "@/components/forms/test-builder-form";
import { PageShell } from "@/components/shared/page-shell";

/**
 * New test page with simplified admin-first workflow.
 */
export default function NewTestPage() {
  return (
    <PageShell
      title="Create Test"
      description="Create a new test quickly using only the essential fields. Question count and marks will be managed later."
    >
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <TestForm mode="create" />
      </div>
    </PageShell>
  );
}