"use client";

import { useEffect, useState } from "react";
import { Users, ChevronRight, ShieldCheck, ShieldAlert, ArrowLeft } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SubAdmin {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  overrideCount: number;
}

interface PermissionItem {
  id: string;
  key: string;
  label: string;
  description: string | null;
  granted: boolean;
  source: "ROLE_DEFAULT" | "OVERRIDE" | "DENIED";
}

interface UserPermissions {
  user: { id: string; fullName: string; email: string };
  permissions: PermissionItem[];
}

// ─── Permission groups — for visual grouping in UI ────────────────────────────
const PERMISSION_GROUPS: Record<string, string[]> = {
  "Content Management": ["question.manage", "test.manage", "category.manage"],
  "Student & Batch":    ["student.manage", "batch.manage"],
  "Finance":            ["payment.manage", "coupon.manage", "revenue.view"],
  "Reporting":          ["report.view", "activity.view"],
  "Platform":           ["announcement.manage", "permission.manage"],
};

export default function PermissionsPage() {
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserPermissions | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingUser, setLoadingUser] = useState(false);

  // ── Fetch all sub-admins on mount ───────────────────────────────────────────
  useEffect(() => {
    fetchSubAdmins();
  }, []);

  async function fetchSubAdmins() {
    try {
      const res = await fetch("/api/admin/permissions");
      if (!res.ok) throw new Error("Failed to fetch sub-admins");
      const data = await res.json();
      setSubAdmins(data.subAdmins);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  }

  // ── Fetch permissions for a specific sub-admin ──────────────────────────────
  async function selectUser(userId: string) {
    setLoadingUser(true);
    try {
      const res = await fetch(`/api/admin/permissions/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch permissions");
      const data = await res.json();
      setSelectedUser(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUser(false);
    }
  }

  // ── Handle toggle/reset from PermissionToggle component ────────────────────
  // Updates local state immediately so UI reflects change without refetch
  async function handlePermissionUpdate(key: string, granted: boolean | null) {
    if (!selectedUser) return;

    // Send PATCH to API
    await fetch(`/api/admin/permissions/${selectedUser.user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissionKey: key, granted }),
    });

    // Refresh the user permissions from server (ensures source tag updates)
    const res = await fetch(`/api/admin/permissions/${selectedUser.user.id}`);
    if (res.ok) {
      const data = await res.json();
      setSelectedUser(data);
    }

    // Also update the override count in the left panel
    setSubAdmins((prev) =>
      prev.map((u) => {
        if (u.id !== selectedUser.user.id) return u;
        const delta = granted === null ? -1 : 1;
        return { ...u, overrideCount: Math.max(0, u.overrideCount + delta) };
      })
    );
  }

  // ── Get permissions for a group ─────────────────────────────────────────────
  function getGroupPermissions(keys: string[]) {
    return selectedUser?.permissions.filter((p) => keys.includes(p.key)) ?? [];
  }

  // ── Count granted permissions ───────────────────────────────────────────────
  function countGranted() {
    return selectedUser?.permissions.filter((p) => p.granted).length ?? 0;
  }

  return (
    <div className="p-6 space-y-6">
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Permission Management
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Control what each sub-admin can access across the platform
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left panel — sub-admin list ───────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Sub Admins ({subAdmins.length})
                </span>
              </div>
            </div>

            {/* Loading state */}
            {loadingList && (
              <div className="p-8 text-center text-sm text-slate-400">
                Loading...
              </div>
            )}

            {/* Empty state */}
            {!loadingList && subAdmins.length === 0 && (
              <div className="p-8 text-center">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No sub-admins found</p>
                <p className="text-xs text-slate-400 mt-1">
                  Create a sub-admin user first
                </p>
              </div>
            )}

            {/* Sub-admin list */}
            {subAdmins.map((user) => (
              <button
                key={user.id}
                onClick={() => selectUser(user.id)}
                className={`
                  w-full flex items-center justify-between px-4 py-3 text-left
                  border-b border-slate-100 dark:border-slate-700/50 last:border-0
                  hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors
                  ${selectedUser?.user.id === user.id
                    ? "bg-slate-100 dark:bg-slate-700"
                    : ""
                  }
                `}
              >
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
                  {/* Show override count as a subtle indicator */}
                  {user.overrideCount > 0 && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 inline-block">
                      {user.overrideCount} custom override{user.overrideCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* ── Right panel — permission toggles ─────────────────────────────── */}
        <div className="lg:col-span-2">
          {/* No user selected yet */}
          {!selectedUser && !loadingUser && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Select a sub-admin from the left
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                to manage their permissions
              </p>
            </div>
          )}

          {/* Loading user permissions */}
          {loadingUser && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
              <p className="text-sm text-slate-400">Loading permissions...</p>
            </div>
          )}

          {/* Permission groups */}
          {selectedUser && !loadingUser && (
            <div className="space-y-4">
              {/* User header card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      {selectedUser.user.fullName}
                    </p>
                    <p className="text-sm text-slate-400">{selectedUser.user.email}</p>
                  </div>
                  {/* Granted count summary */}
                  <div className="text-right">
                    <p className="text-2xl font-bold text-emerald-600">
                      {countGranted()}
                      <span className="text-sm text-slate-400 font-normal">
                        /{selectedUser.permissions.length}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400">permissions granted</p>
                  </div>
                </div>
              </div>

              {/* Permission groups */}
              {Object.entries(PERMISSION_GROUPS).map(([groupName, keys]) => {
                const groupPerms = getGroupPermissions(keys);
                if (groupPerms.length === 0) return null;

                const allGranted = groupPerms.every((p) => p.granted);
                const noneGranted = groupPerms.every((p) => !p.granted);

                return (
                  <div
                    key={groupName}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                  >
                    {/* Group header */}
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {groupName}
                      </span>
                      {/* Group-level granted indicator */}
                      <span className={`
                        text-xs px-2 py-0.5 rounded-full font-medium
                        ${allGranted
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                          : noneGranted
                            ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                        }
                      `}>
                        {allGranted ? "All Access" : noneGranted ? "No Access" : "Partial"}
                      </span>
                    </div>

                    {/* Permission items */}
                    <div className="p-3 space-y-2">
                      {groupPerms.map((perm) => (
                        <div key={perm.key} className={`
                          flex items-center justify-between p-3 rounded-xl border transition-all duration-200
                          ${perm.granted
                            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                            : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900"
                          }
                        `}>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {perm.label}
                            </p>
                            {perm.description && (
                              <p className="text-xs text-slate-500 mt-0.5">{perm.description}</p>
                            )}
                            <span className={`
                              inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full
                              ${perm.source === "OVERRIDE"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                              }
                            `}>
                              {perm.source === "OVERRIDE" ? "Custom Override" : "Role Default"}
                            </span>
                          </div>

                          {/* Toggle + reset */}
                          <div className="flex items-center gap-2 ml-4 shrink-0">
                            {perm.source === "OVERRIDE" && (
                              <button
                                onClick={() => handlePermissionUpdate(perm.key, null)}
                                title="Reset to role default"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-all"
                              >
                                {/* RotateCcw icon inline */}
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => handlePermissionUpdate(perm.key, !perm.granted)}
                              className={`
                                relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none
                                focus:ring-2 focus:ring-offset-2
                                ${perm.granted
                                  ? "bg-emerald-500 focus:ring-emerald-400"
                                  : "bg-slate-300 dark:bg-slate-600 focus:ring-slate-400"
                                }
                              `}
                            >
                              <span className={`
                                absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm
                                transition-transform duration-300
                                ${perm.granted ? "translate-x-5" : "translate-x-0"}
                              `} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}