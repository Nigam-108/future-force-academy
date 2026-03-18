import Link from "next/link";
import { notFound } from "next/navigation";
import { StudentBatchAssignmentClient } from "@/components/admin/student-batch-assignment-client";
import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";

type StudentBatchPageProps = {
  params: Promise<{ id: string }>;
};

type StudentDetailResponse = {
  student: {
    id: string;
    fullName: string;
    email: string;
    mobileNumber: string | null;
    status: string;
  };
  stats: {
    totalAttempts: number;
    submittedAttemptsCount: number;
    inProgressAttemptsCount: number;
  };
  recentAttempts: unknown[];
};

export default async function StudentBatchPage({
  params,
}: StudentBatchPageProps) {
  const { id } = await params;

  // Fetch real student data so we can show their name
  const result = await fetchInternalApi<StudentDetailResponse>(
    `/api/admin/students/${id}`
  );

  if (!result.success && result.status === 404) {
    notFound();
  }

  const studentName = result.success && result.data
    ? result.data.student.fullName
    : `Student`;

  const studentEmail = result.success && result.data
    ? result.data.student.email
    : "";

  const studentStatus = result.success && result.data
    ? result.data.student.status
    : "";

  return (
    <PageShell
      title="Student Batch Assignment"
      description="Assign this student to one or more exam batches to control their test access."
    >
      {/* Back navigation */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/admin/students"
          className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to Students
        </Link>
        <Link
          href={`/admin/students/${id}`}
          className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Student Details
        </Link>
      </div>

      {/* Student identity card */}
      {result.success && result.data ? (
        <div className="mb-6 rounded-3xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white">
              {studentName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {studentName}
              </h2>
              <p className="text-sm text-slate-500">{studentEmail}</p>
            </div>
            <span
              className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                studentStatus === "ACTIVE"
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-rose-50 text-rose-700 ring-rose-200"
              }`}
            >
              {studentStatus}
            </span>
          </div>
        </div>
      ) : null}

      <StudentBatchAssignmentClient
        studentId={id}
        studentName={studentName}
      />
    </PageShell>
  );
}