import { SignupSettingsManager } from "@/components/admin/signup-settings-manager";

export default function AdminSignupSettingsPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
            Admin Panel
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Signup Settings</h1>
          <p className="mt-3 text-sm text-slate-600">
            Manage draft and published signup behavior rules. New published settings apply only to
            new signup attempts.
          </p>
        </div>

        <SignupSettingsManager />
      </div>
    </div>
  );
}