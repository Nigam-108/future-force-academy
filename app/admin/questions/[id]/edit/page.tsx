import { notFound } from "next/navigation";

import {
  QuestionForm,
  type QuestionFormInitialValues,
} from "@/components/forms/question-form";
import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";

type EditQuestionPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type AdminQuestionDetailResponse = QuestionFormInitialValues & {
  id: string;
};

export default async function EditQuestionPage({
  params,
}: EditQuestionPageProps) {
  const { id } = await params;

  const result = await fetchInternalApi<AdminQuestionDetailResponse>(
    `/api/admin/questions/${id}`
  );

  if (!result.success && result.status === 404) {
    notFound();
  }

  return (
    <PageShell
      title="Edit MCQ"
      description="Update the question text, options, correct answer, and explanation using the simplified fast-entry workflow."
    >
      {!result.success || !result.data ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {result.message}
        </div>
      ) : (
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <QuestionForm
            mode="edit"
            questionId={id}
            initialValues={result.data}
          />
        </div>
      )}
    </PageShell>
  );
}