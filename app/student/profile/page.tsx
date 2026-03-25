import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";

type ProfileResponse = {
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
};

export default async function StudentProfilePage() {
  const result = await fetchInternalApi<ProfileResponse>("/api/student/profile");

  return (
    <PageShell
      title="Profile"
      description="Manage your account details and preferences."
    >
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        {!result.success || !result.data ? (
          <p className="text-sm text-slate-600">{result.message}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Display Name</p>
              <p className="mt-1 font-medium text-slate-900">
                {result.data.displayName || result.data.fullName}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">First Name</p>
              <p className="mt-1 font-medium text-slate-900">
                {result.data.firstName || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Last Name</p>
              <p className="mt-1 font-medium text-slate-900">
                {result.data.lastName || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Email</p>
              <p className="mt-1 font-medium text-slate-900">
                {result.data.email}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Mobile Number</p>
              <p className="mt-1 font-medium text-slate-900">
                {result.data.mobileNumber || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Preferred Language</p>
              <p className="mt-1 font-medium text-slate-900">
                {result.data.preferredLanguage}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Email Verified</p>
              <p className="mt-1 font-medium text-slate-900">
                {result.data.emailVerified ? "Yes" : "No"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Status</p>
              <p className="mt-1 font-medium text-slate-900">
                {result.data.status}
              </p>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}