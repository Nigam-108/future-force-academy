"use client";

import { useState } from "react";
import { Shield, ShieldOff, RotateCcw } from "lucide-react";

// ─── Props ────────────────────────────────────────────────────────────────────
interface PermissionToggleProps {
  userId: string;
  permissionKey: string;
  label: string;
  description?: string | null;
  granted: boolean;
  // ROLE_DEFAULT = inherited from role, OVERRIDE = manually set by admin, DENIED = nothing found
  source: "ROLE_DEFAULT" | "OVERRIDE" | "DENIED";
  onUpdate: (key: string, granted: boolean | null) => void;
}

export function PermissionToggle({
  userId,
  permissionKey,
  label,
  description,
  granted,
  source,
  onUpdate,
}: PermissionToggleProps) {
  const [loading, setLoading] = useState(false);

  // ── Toggle handler ──────────────────────────────────────────────────────────
  // Flips current value and sends PATCH to API
  async function handleToggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/permissions/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionKey, granted: !granted }),
      });

      if (!res.ok) throw new Error("Failed to update permission");
      onUpdate(permissionKey, !granted);
    } catch (err) {
      console.error("Permission toggle error:", err);
    } finally {
      setLoading(false);
    }
  }

  // ── Reset to role default ───────────────────────────────────────────────────
  // Sends granted: null which tells API to delete the override
  async function handleReset() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/permissions/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionKey, granted: null }),
      });

      if (!res.ok) throw new Error("Failed to reset permission");
      onUpdate(permissionKey, null);
    } catch (err) {
      console.error("Permission reset error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`
      flex items-center justify-between p-4 rounded-xl border transition-all duration-200
      ${granted
        ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
        : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900"
      }
    `}>
      {/* Left — permission info */}
      <div className="flex items-start gap-3">
        {/* Icon based on granted/denied */}
        <div className={`mt-0.5 ${granted ? "text-emerald-600" : "text-red-500"}`}>
          {granted ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {label}
          </p>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {description}
            </p>
          )}
          {/* Source badge — shows if this is a custom override or default */}
          <span className={`
            inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full
            ${source === "OVERRIDE"
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            }
          `}>
            {source === "OVERRIDE" ? "Custom Override" : "Role Default"}
          </span>
        </div>
      </div>

      {/* Right — toggle + reset */}
      <div className="flex items-center gap-2 ml-4 shrink-0">
        {/* Reset button — only show when there's an override */}
        {source === "OVERRIDE" && (
          <button
            onClick={handleReset}
            disabled={loading}
            title="Reset to role default"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Toggle switch */}
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`
            relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none
            focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
            ${granted
              ? "bg-emerald-500 focus:ring-emerald-400"
              : "bg-slate-300 dark:bg-slate-600 focus:ring-slate-400"
            }
          `}
        >
          <span className={`
            absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm
            transition-transform duration-300
            ${granted ? "translate-x-5" : "translate-x-0"}
          `} />
        </button>
      </div>
    </div>
  );
}