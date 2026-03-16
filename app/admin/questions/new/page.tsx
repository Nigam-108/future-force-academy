import { QuestionForm } from "@/components/forms/question-form";
import { PageShell } from "@/components/shared/page-shell";

export default function NewQuestionPage() {
  return (
    <PageShell
      title="Quick Add MCQ"
      description="Fast-entry mode for creating many single-correct questions without extra admin fields."
    >
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <QuestionForm mode="create" />
      </div>
    </PageShell>
  );
}