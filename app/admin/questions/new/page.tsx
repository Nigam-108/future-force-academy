import { QuestionForm } from "@/components/forms/question-form";
import { PageShell } from "@/components/shared/page-shell";

export default function NewQuestionPage() {
  return (
    <PageShell title="Add Question" description="Create a new question with options, explanation, labels, and metadata.">
      <QuestionForm />
    </PageShell>
  );
}
