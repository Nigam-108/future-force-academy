import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";


type AdminStudentsResponse = {
  items: Array<{
    id: string;
    fullName: string;
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string;
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

function getStudentDisplayName(student: {
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string;
}) {
  if (student.displayName) return student.displayName;

  const fromParts = [student.firstName, student.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fromParts || getStudentDisplayName(student);
}

export default async function AdminStudentsPage() {
  const result = await fetchInternalApi<AdminStudentsResponse>("/api/admin/students");

  return (
    <PageShell
      title="Student List"
      description="Manage students and assign them to exam batches."
    >
      <div className="space-y-6">
        {result.success && result.data ? (
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Total Students</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {result.data.total}
            </p>
          </div>
        ) : null}

        {!result.success || !result.data ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {result.message}
          </div>
        ) : result.data.items.length === 0 ? (
          <div className="rounded-3xl border border-dashed bg-white p-10 text-center">
            <h2 className="text-xl font-semibold text-slate-900">
              No students found
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Students will appear here after registration/import.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {result.data.items.map((student) => (
              <div
                key={student.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {getStudentDisplayName(student)}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">{student.email}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      Status: {student.status} • Language: {student.preferredLanguage}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/admin/students/${student.id}`}
                      className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      View Details
                    </Link>

                    <Link
                      href={`/admin/students/${student.id}/batches`}
                      className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Assign Batches
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}