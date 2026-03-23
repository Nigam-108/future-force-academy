"use client";

import { useEffect, useState, useCallback } from "react";
import { Activity, Filter, RefreshCw, User, Clock } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ActivityLogEntry {
  id: string;
  action: string;
  description: string;
  resourceType: string | null;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  userFullName: string;
  userId: string;
}

interface LogsResponse {
  logs: ActivityLogEntry[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Action color coding ──────────────────────────────────────────────────────
// Makes it easy to scan logs at a glance
function getActionStyle(action: string) {
  if (action.includes("created") || action.includes("imported")) {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400";
  }
  if (action.includes("deleted")) {
    return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400";
  }
  if (action.includes("updated") || action.includes("changed") || action.includes("toggled")) {
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400";
  }
  if (action.includes("blocked")) {
    return "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400";
  }
  if (action.includes("enrolled") || action.includes("reconciled")) {
    return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400";
  }
  return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
}

// ─── Resource type badge ──────────────────────────────────────────────────────
function ResourceBadge({ type }: { type: string | null }) {
  if (!type) return null;
  return (
    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 uppercase tracking-wide">
      {type}
    </span>
  );
}

export default function ActivityLogsPage() {
  const [data, setData] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // ── Filter state ────────────────────────────────────────────────────────────
  const [filterAction, setFilterAction]           = useState("");
  const [filterResourceType, setFilterResourceType] = useState("");
  const [filterFrom, setFilterFrom]               = useState("");
  const [filterTo, setFilterTo]                   = useState("");

  // ── Fetch logs ──────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page",  String(page));
      params.set("limit", "50");

      if (filterAction)       params.set("action",       filterAction);
      if (filterResourceType) params.set("resourceType", filterResourceType);
      if (filterFrom)         params.set("from",         filterFrom);
      if (filterTo)           params.set("to",           filterTo);

      const res = await fetch(`/api/admin/activity-logs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch logs");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filterAction, filterResourceType, filterFrom, filterTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // ── Reset to page 1 when filters change ────────────────────────────────────
  function applyFilters() {
    setPage(1);
    fetchLogs();
  }

  function clearFilters() {
    setFilterAction("");
    setFilterResourceType("");
    setFilterFrom("");
    setFilterTo("");
    setPage(1);
  }

  return (
    <div className="p-6 space-y-6">
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Activity Logs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Every admin action is tracked here for security and accountability
          </p>
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Filters
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Action filter */}
          <input
            type="text"
            placeholder="Action (e.g. question.created)"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Resource type filter */}
          <select
            value={filterResourceType}
            onChange={(e) => setFilterResourceType(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All resource types</option>
            <option value="question">Question</option>
            <option value="test">Test</option>
            <option value="batch">Batch</option>
            <option value="student">Student</option>
            <option value="payment">Payment</option>
            <option value="coupon">Coupon</option>
          </select>

          {/* Date from */}
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Date to */}
          <input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={applyFilters}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            Apply Filters
          </button>
          <button
            onClick={clearFilters}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* ── Logs table ───────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header row */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {data ? `${data.total} total logs` : "Loading..."}
            </span>
          </div>
          {data && data.totalPages > 1 && (
            <span className="text-xs text-slate-400">
              Page {data.page} of {data.totalPages}
            </span>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="p-12 text-center text-sm text-slate-400">
            Loading activity logs...
          </div>
        )}

        {/* Empty state */}
        {!loading && data?.logs.length === 0 && (
          <div className="p-12 text-center">
            <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No activity logs found</p>
            <p className="text-sm text-slate-400 mt-1">
              Try adjusting your filters or start performing admin actions
            </p>
          </div>
        )}

        {/* Log entries */}
        {!loading && data && data.logs.length > 0 && (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {data.logs.map((log) => (
              <div
                key={log.id}
                className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Admin avatar initial */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                    {log.userFullName.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Top row — action badge + resource + time */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Action badge — color coded by type */}
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${getActionStyle(log.action)}`}>
                        {log.action}
                      </span>

                      {/* Resource type badge */}
                      <ResourceBadge type={log.resourceType} />

                      {/* Timestamp */}
                      <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto shrink-0">
                        <Clock className="w-3 h-3" />
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                      {log.description}
                    </p>

                    {/* Who did it */}
                    <p className="mt-0.5 text-xs text-slate-400 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {log.userFullName}
                      {log.ipAddress && (
                        <span className="ml-2 text-slate-300 dark:text-slate-600">
                          · {log.ipAddress}
                        </span>
                      )}
                    </p>

                    {/* Metadata — show if present (e.g. status changes) */}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="mt-1.5 rounded-lg bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {JSON.stringify(log.metadata)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────────────────────────── */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          {/* Page numbers */}
          {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
            const p = page <= 3
              ? i + 1
              : page >= data.totalPages - 2
                ? data.totalPages - 4 + i
                : page - 2 + i;
            if (p < 1 || p > data.totalPages) return null;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                  p === page
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                {p}
              </button>
            );
          })}

          <button
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page === data.totalPages}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}