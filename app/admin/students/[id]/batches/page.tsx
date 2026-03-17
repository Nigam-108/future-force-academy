import { StudentBatchAssignmentClient } from "@/components/admin/student-batch-assignment-client";
import { PageShell } from "@/components/shared/page-shell";

type StudentBatchPageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Student-to-batch assignment page.
 *
 * For now, we use student id in title area directly.
 * Later you can hydrate student details from your student detail endpoint if needed.
 */
export default async function StudentBatchPage({
  params,
}: StudentBatchPageProps) {
  const { id } = await params;

  return (
    <PageShell
      title="Student Batch Assignment"
      description="Assign this student to one or more exam batches."
    >
      <StudentBatchAssignmentClient
        studentId={id}
        studentName={`Student ${id}`}
      />
    </PageShell>
  );
}