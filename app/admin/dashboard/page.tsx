import Link from "next/link";
import { AdminQuickActions } from "@/components/admin/quick-actions";
import { AdminStatsCards } from "@/components/admin/stats-cards";
import { RecentActivity } from "@/components/admin/recent-activity";
import { PageShell } from "@/components/shared/page-shell";

export default function AdminDashboardPage() {
  return (
    <PageShell
      title="Admin Dashboard"
      description="Manage your platform, monitor activity, and review key operational insights."
    >
      <div className="space-y-6">
        <AdminStatsCards />

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Auth Operations</h2>
              <p className="text-sm text-slate-500">
                Track signup, OTP, and login issues from one place.
              </p>
            </div>

            <Link
              href="/admin/auth-insights"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Open Auth Insights
            </Link>
          </div>
        </div>

        <AdminQuickActions />
        <RecentActivity />
      </div>
    </PageShell>
  );
}