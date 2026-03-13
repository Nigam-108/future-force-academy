import Link from "next/link";
import { DashboardCards } from "@/components/student/dashboard-cards";
import { PageShell } from "@/components/shared/page-shell";

export default function StudentDashboardPage() {
  return (
    <PageShell
      title="Dashboard"
      description="Track your enrolled tests, upcoming tests, and results."
    >
      <div className="mb-8 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 p-8 text-white shadow-sm">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-200">
            Future Force Academy
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            Welcome to your student portal
          </h2>
          <p className="mt-3 text-sm text-slate-300">
            Continue your exam journey with structured tests, result tracking,
            purchases, and upcoming schedules — all in one place.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/student/tests"
              className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Go to Tests
            </Link>
            <Link
              href="/student/results"
              className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              View Results
            </Link>
          </div>
        </div>
      </div>

      <DashboardCards />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white">
              Start/Resume Test
            </button>
            <button className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700">
              View Results
            </button>
            <button className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700">
              My Purchases
            </button>
            <button className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700">
              Upcoming Tests
            </button>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>Attempted WPSI Mock Test 03</p>
            <p>Saved UPSC CSAT Practice Set</p>
            <p>Purchased WPSI Full Mock Test Series</p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}