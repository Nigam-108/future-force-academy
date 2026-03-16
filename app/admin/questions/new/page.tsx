import { QuestionForm } from "@/components/forms/question-form";
import { PageShell } from "@/components/shared/page-shell";

export default function NewQuestionPage() {
  return (
    <PageShell
      title="Create Question"
      description="Add a real question into the admin question bank using the live backend API."
    >
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <QuestionForm mode="create" />
      </div>
    </PageShell>
  );
}