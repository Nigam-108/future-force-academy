"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type PendingPolicy = {
  id: string;
  policyType: "TERMS" | "PRIVACY" | "REFUND_CANCELLATION";
  label: string;
  title: string;
  versionNumber: number;
  summary: string;
  publishedAt?: string | null;
  route: string;
  viewUrl: string;
};

type PolicyNoticeResponse = {
  success: boolean;
  message: string;
  data?: {
    hasPendingAcknowledgements: boolean;
    pendingPolicies: PendingPolicy[];
    totalPendingPolicies: number;
  };
};

type AcknowledgeResponse = {
  success: boolean;
  message: string;
  data?: {
    acknowledgedCount: number;
    acknowledgedPolicyIds: string[];
  };
};

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PolicyUpdateNotice() {
  const pathname = usePathname();

  const [isLoading, setIsLoading] = useState(true);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingPolicies, setPendingPolicies] = useState<PendingPolicy[]>([]);

  const shouldRender = useMemo(() => pendingPolicies.length > 0, [pendingPolicies]);

  useEffect(() => {
    let isMounted = true;

    async function loadNotices() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch("/api/auth/policy-notices", {
          method: "GET",
          cache: "no-store",
        });

        if (response.status === 401) {
          if (!isMounted) return;
          setPendingPolicies([]);
          return;
        }

        const result = (await response.json()) as PolicyNoticeResponse;

        if (!response.ok || !result.success || !result.data) {
          if (!isMounted) return;
          setPendingPolicies([]);
          return;
        }

        if (!isMounted) return;

        setPendingPolicies(result.data.pendingPolicies);
      } catch {
        if (!isMounted) return;
        setPendingPolicies([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadNotices();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  async function handleAcknowledgeAll() {
    try {
      setIsAcknowledging(true);
      setErrorMessage("");

      const response = await fetch("/api/auth/policy-notices/acknowledge-all", {
        method: "POST",
      });

      const result = (await response.json()) as AcknowledgeResponse;

      if (!response.ok || !result.success) {
        setErrorMessage(result.message || "Failed to save policy acknowledgement");
        return;
      }

      setPendingPolicies([]);
    } catch {
      setErrorMessage("Something went wrong while saving acknowledgement.");
    } finally {
      setIsAcknowledging(false);
    }
  }

  if (isLoading || !shouldRender) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
            Policy update notice
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Please review and acknowledge updated policies
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Your account has one or more policy updates pending. You can use one button to acknowledge all,
            but the system will store separate records for each updated policy version.
          </p>
        </div>

        <div className="max-h-[65vh] space-y-4 overflow-y-auto px-6 py-5">
          {pendingPolicies.map((policy) => (
            <div
              key={policy.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  {policy.label}
                </span>
                <span className="text-xs text-slate-500">
                  Version {policy.versionNumber}
                </span>
                <span className="text-xs text-slate-500">
                  Published: {formatDate(policy.publishedAt)}
                </span>
              </div>

              <h3 className="mt-3 text-lg font-semibold text-slate-900">{policy.title}</h3>

              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                {policy.summary}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={policy.viewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  View Updated Policy
                </Link>

                <Link
                  href={policy.route}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Open Latest Policy Page
                </Link>
              </div>
            </div>
          ))}

          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            Pending updates: <span className="font-semibold text-slate-900">{pendingPolicies.length}</span>
          </p>

          <button
            type="button"
            onClick={handleAcknowledgeAll}
            disabled={isAcknowledging}
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isAcknowledging ? "Saving..." : "I Understand / Acknowledge All"}
          </button>
        </div>
      </div>
    </div>
  );
}