"use client";

import { useEffect, useState } from "react";

type AuthInsightsResponse = {
  success: boolean;
  message: string;
  data?: {
    days: number;
    summary: {
      signupStarts: number;
      otpVerified: number;
      signupCompleted: number;
      loginSuccess: number;
      loginFailed: number;
      otpFailed: number;
      signupConversionRate: number;
      otpSuccessRate: number;
      loginFailureRate: number;
    };
    recentEvents: Array<{
      id: string;
      eventType: string;
      email: string | null;
      mobileNumber: string | null;
      userId: string | null;
      ipAddress: string | null;
      createdAt: string;
    }>;
  };
};

function cardStyle() {
  return "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";
}

export function AuthInsightsPanel() {
  const [days, setDays] = useState<7 | 30>(7);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AuthInsightsResponse["data"]>();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/auth-insights?days=${days}`, {
          cache: "no-store",
        });
        const json = (await response.json()) as AuthInsightsResponse;

        if (!cancelled && json.success && json.data) {
          setData(json.data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [days]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Auth Insights</h2>
          <p className="text-sm text-slate-500">
            OTP, signup, login, and conversion visibility.
          </p>
        </div>

        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value) as 7 | 30)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {loading ? (
        <div className={cardStyle()}>Loading auth insights...</div>
      ) : !data ? (
        <div className={cardStyle()}>Unable to load auth insights.</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <div className={cardStyle()}>
              <p className="text-xs uppercase tracking-wide text-slate-500">Signup Starts</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{data.summary.signupStarts}</p>
            </div>

            <div className={cardStyle()}>
              <p className="text-xs uppercase tracking-wide text-slate-500">OTP Verified</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{data.summary.otpVerified}</p>
            </div>

            <div className={cardStyle()}>
              <p className="text-xs uppercase tracking-wide text-slate-500">Signup Completed</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{data.summary.signupCompleted}</p>
            </div>

            <div className={cardStyle()}>
              <p className="text-xs uppercase tracking-wide text-slate-500">Login Success</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{data.summary.loginSuccess}</p>
            </div>

            <div className={cardStyle()}>
              <p className="text-xs uppercase tracking-wide text-slate-500">Login Failed</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{data.summary.loginFailed}</p>
            </div>

            <div className={cardStyle()}>
              <p className="text-xs uppercase tracking-wide text-slate-500">OTP Failures</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{data.summary.otpFailed}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className={cardStyle()}>
              <p className="text-xs uppercase tracking-wide text-slate-500">Signup Conversion</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">
                {data.summary.signupConversionRate}%
              </p>
            </div>

            <div className={cardStyle()}>
              <p className="text-xs uppercase tracking-wide text-slate-500">OTP Success Rate</p>
              <p className="mt-2 text-3xl font-bold text-blue-600">
                {data.summary.otpSuccessRate}%
              </p>
            </div>

            <div className={cardStyle()}>
              <p className="text-xs uppercase tracking-wide text-slate-500">Login Failure Rate</p>
              <p className="mt-2 text-3xl font-bold text-amber-600">
                {data.summary.loginFailureRate}%
              </p>
            </div>
          </div>

          <div className={cardStyle()}>
            <h3 className="text-lg font-semibold text-slate-900">Recent Auth Events</h3>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="px-2 py-2">Event</th>
                    <th className="px-2 py-2">Email</th>
                    <th className="px-2 py-2">Mobile</th>
                    <th className="px-2 py-2">IP</th>
                    <th className="px-2 py-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentEvents.map((event) => (
                    <tr key={event.id} className="border-b last:border-none">
                      <td className="px-2 py-2 font-medium text-slate-900">{event.eventType}</td>
                      <td className="px-2 py-2 text-slate-700">{event.email || "—"}</td>
                      <td className="px-2 py-2 text-slate-700">{event.mobileNumber || "—"}</td>
                      <td className="px-2 py-2 text-slate-700">{event.ipAddress || "—"}</td>
                      <td className="px-2 py-2 text-slate-700">
                        {new Intl.DateTimeFormat("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(event.createdAt))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}