import { AdminQuickActions } from "@/components/admin/quick-actions";
import { AdminStatsCards } from "@/components/admin/stats-cards";
import { PageShell } from "@/components/shared/page-shell";

export default function AdminDashboardPage() {
  return (
    <PageShell title="Dashboard" description="Overview of students, tests, payments, and recent activity.">
      <AdminStatsCards />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <AdminQuickActions />

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>New WPSI live test scheduled.</p>
            <p>Question bank updated for GPSC category.</p>
            <p>43 students registered in the last 7 days.</p>
            <p>Payments updated for 12 new purchases.</p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}