import Link from "next/link";
import { notFound } from "next/navigation";

import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";
import { TestQuestionAssignmentClient } from "@/components/admin/test-question-assignment-client";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type TestDetailResponse = {
  id: string;
  title: string;
  slug: string;
  structureType: "SINGLE" | "SECTIONAL";
  sections: Array<{
    id: string;
    title: string;
    displayOrder: number;
    totalQuestions: number;
    durationInMinutes: number | null;
    positiveMarks: number | null;
    negativeMarks: number | null;
  }>;
};

export default async function AdminTestQuestionsPage({ params }: PageProps) {
  const { id } = await params;

  const result = await fetchInternalApi<TestDetailResponse>(
    `/api/admin/tests/${id}`
  );

  if (!result.success && result.status === 404) {
    notFound();
  }

  return (
    <PageShell
      title="Assign Questions"
      description="Manage which questions are linked to this test using the real assignment backend."
    >
      {!result.success || !result.data ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {result.message}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/tests"
              className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Back to Tests
            </Link>

            <Link
              href={`/admin/tests/${id}/edit`}
              className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit Test
            </Link>
          </div>

          <TestQuestionAssignmentClient
            testId={result.data.id}
            testTitle={result.data.title}
            structureType={result.data.structureType}
            sections={result.data.sections}
          />
        </div>
      )}
    </PageShell>
  );
}