"use client";

import { useEffect, useState, useCallback } from "react";

type Attempt = {
  id: string;
  status: string;
  createdAt: string;
  user: { id: string; fullName: string; email: string };
  test: { id: string; title: string; slug: string };
};

type ReportsResponse = {
  success: boolean;
  data?: {
    recentAttempts: Attempt[];
    counts: {
      totalStudents: number;
      totalAttempts: number;
      submittedAttempts: number;
    };
  };
};

function statusColor(status: string) {
  switch (status) {
    case "SUBMITTED":
      return "bg-emerald-100 text-emerald-700";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "short" }).format(
    new Date(dateStr)
  );
}

export function RecentActivity() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pulse, setPulse] = useState(false);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/reports", {
        cache: "no-store",
      });
      const json = (await res.json()) as ReportsResponse;
      if (json.success && json.data) {
        setAttempts(json.data.recentAttempts);
        setLastUpdated(new Date());
        // Pulse the dot to show update
        setPulse(true);
        setTimeout(() => setPulse(false), 1000);
      }
    } catch {
      // silent fail — stale data is fine
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchActivity();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => void fetchActivity(), 30000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Recent Activity
        </h2>
        <div className="flex items-center gap-2">
          {/* Live indicator */}
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <span
              className={`h-1.5 w-1.5 rounded-full bg-emerald-500 transition-all ${
                pulse ? "scale-150 bg-emerald-400" : ""
              }`}
            />
            Live
          </span>
          {/* Manual refresh */}
          <button
            type="button"
            onClick={() => void fetchActivity()}
            className="rounded-xl border px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors"
            title="Refresh now"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Last updated */}
      {lastUpdated ? (
        <p className="mt-1 text-xs text-slate-400">
          Updated {timeAgo(lastUpdated.toISOString())} · auto-refreshes every 30s
        </p>
      ) : null}

      {/* Content */}
      <div className="mt-4 space-y-3">
        {loading ? (
          // Skeleton
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 animate-pulse"
            >
              <div className="h-8 w-8 shrink-0 rounded-xl bg-slate-200" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/4 rounded bg-slate-200" />
                <div className="h-2.5 w-1/2 rounded bg-slate-200" />
              </div>
            </div>
          ))
        ) : attempts.length === 0 ? (
          <p className="text-sm text-slate-500">
            No recent activity yet.
          </p>
        ) : (
          attempts.map((attempt) => (
            <div
              key={attempt.id}
              className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 transition-colors hover:bg-slate-100"
            >
              {/* Avatar */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white">
                {attempt.user.fullName.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {attempt.user.fullName}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {attempt.test.title}
                </p>
              </div>

              {/* Status + time */}
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor(
                    attempt.status
                  )}`}
                >
                  {attempt.status === "IN_PROGRESS"
                    ? "In Progress"
                    : attempt.status === "SUBMITTED"
                    ? "Submitted"
                    : attempt.status}
                </span>
                <span className="text-[10px] text-slate-400">
                  {timeAgo(attempt.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}