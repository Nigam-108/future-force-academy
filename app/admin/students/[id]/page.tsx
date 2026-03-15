import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";

type AdminStudentDetailResponse = {
  student: {
    id: string;
    fullName: string;
    email: string;
    mobileNumber: string | null;
    preferredLanguage: string;
    emailVerified: boolean;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  stats: {
    submittedAttemptsCount: number;
    inProgressAttemptsCount: number;
    totalAttempts: number;
  };
  recentAttempts: Array<{
    id: string;
    status: string;
    createdAt: string;
    test: {
      id: string;
      title: string;
      slug: string;
      mode: string;
      totalMarks: number;
    };
  }>;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminStudentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await fetchInternalApi<AdminStudentDetailResponse>(`/api/admin/students/${id}`);

  if (!result.success || !result.data) {
    return (
      <PageShell title="Student Details" description="View student profile and recent attempts.">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">{result.message}</p>
        </div>
      </PageShell>
    );
  }

  const { student, stats, recentAttempts } = result.data;

  return (
    <PageShell title="Student Details" description="View student profile and recent attempts.">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Total Attempts</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalAttempts}</p>
        </div>
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Submitted</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.submittedAttemptsCount}</p>
        </div>
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">In Progress</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.inProgressAttemptsCount}</p>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Student Profile</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">Full Name</p>
            <p className="mt-1 font-medium text-slate-900">{student.fullName}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Email</p>
            <p className="mt-1 font-medium text-slate-900">{student.email}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Mobile</p>
            <p className="mt-1 font-medium text-slate-900">{student.mobileNumber ?? "Not set"}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Preferred Language</p>
            <p className="mt-1 font-medium text-slate-900">{student.preferredLanguage}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Status</p>
            <p className="mt-1 font-medium text-slate-900">{student.status}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Email Verified</p>
            <p className="mt-1 font-medium text-slate-900">{student.emailVerified ? "Yes" : "No"}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Recent Attempts</h2>
        <div className="mt-4 space-y-4">
          {recentAttempts.length === 0 ? (
            <p className="text-sm text-slate-600">No attempts found.</p>
          ) : (
            recentAttempts.map((attempt) => (
              <div key={attempt.id} className="rounded-2xl border p-4">
                <p className="font-semibold text-slate-900">{attempt.test.title}</p>
                <p className="mt-1 text-sm text-slate-600">Status: {attempt.status}</p>
                <p className="mt-1 text-sm text-slate-500">{new Date(attempt.createdAt).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </PageShell>
  );
}