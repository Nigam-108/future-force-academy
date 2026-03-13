import { QuestionForm } from "@/components/forms/question-form";
import { PageShell } from "@/components/shared/page-shell";

export default function EditQuestionPage() {
  return (
    <PageShell title="Edit Question" description="Modify an existing question and update its metadata or explanation.">
      <QuestionForm />
    </PageShell>
  );
}
