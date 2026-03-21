import { AdminQuickActions } from "@/components/admin/quick-actions";
import { AdminStatsCards } from "@/components/admin/stats-cards";
import { RecentActivity } from "@/components/admin/recent-activity";
import { PageShell } from "@/components/shared/page-shell";

export default function AdminDashboardPage() {
  return (
    <PageShell
      title="Dashboard"
      description="Overview of students, tests, payments, and recent activity."
    >
      <AdminStatsCards />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <AdminQuickActions />
        <RecentActivity />
      </div>
    </PageShell>
  );
}