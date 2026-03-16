import { BulkQuestionImportForm } from "@/components/admin/bulk-question-import-form";
import { PageShell } from "@/components/shared/page-shell";

/**
 * Admin page for bulk paste import.
 *
 * This is intentionally simple and focused on speed.
 */
export default function BulkImportQuestionsPage() {
  return (
    <PageShell
      title="Bulk Import Questions"
      description="Paste multiple MCQs in one go and import them quickly using the simplified fast-entry format."
    >
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <BulkQuestionImportForm />
      </div>
    </PageShell>
  );
}