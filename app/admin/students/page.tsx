import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";

type AdminStudentsResponse = {
  items: Array<{
    id: string;
    fullName: string;
    email: string;
    mobileNumber: string | null;
    preferredLanguage: string;
    emailVerified: boolean;
    status: string;
    createdAt: string;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default async function AdminStudentsPage() {
  const result = await fetchInternalApi<AdminStudentsResponse>("/api/admin/students");

  return (
    <PageShell title="Students" description="Manage students and view their status.">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Student List</h2>
          {result.success && result.data ? (
            <span className="text-sm text-slate-500">Total: {result.data.total}</span>
          ) : null}
        </div>

        {!result.success || !result.data ? (
          <p className="text-sm text-slate-600">{result.message}</p>
        ) : result.data.items.length === 0 ? (
          <p className="text-sm text-slate-600">No students found.</p>
        ) : (
          <div className="space-y-4">
            {result.data.items.map((student) => (
              <div key={student.id} className="rounded-2xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{student.fullName}</p>
                    <p className="mt-1 text-sm text-slate-600">{student.email}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Status: {student.status} • Language: {student.preferredLanguage}
                    </p>
                  </div>
                  <Link
                    href={`/admin/students/${student.id}`}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}