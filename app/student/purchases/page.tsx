import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";

export const dynamic = "force-dynamic";

type PurchaseStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";

type PurchaseItem = {
  id: string;
  status: PurchaseStatus;
  isActive: boolean;
  isExpired: boolean;
  validFrom: string;
  validUntil: string | null;
  createdAt: string;
  batch: {
    id: string;
    title: string;
    slug: string;
    examType: string;
    isPaid: boolean;
    status: string;
  };
  payment: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    gateway: string;
    paidAt: string | null;
  } | null;
};

function formatDate(value: string | null) {
  if (!value) return "No expiry";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
    new Date(value)
  );
}

function statusBadgeClass(isActive: boolean, isExpired: boolean) {
  if (isExpired) return "bg-rose-50 text-rose-700 ring-rose-200";
  if (isActive) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function statusLabel(
  status: PurchaseStatus,
  isExpired: boolean
): string {
  if (isExpired) return "Expired";
  if (status === "ACTIVE") return "Active";
  if (status === "CANCELLED") return "Cancelled";
  return status;
}

export default async function PurchasesPage() {
  const result = await fetchInternalApi<PurchaseItem[]>(
    "/api/student/purchases"
  );

  const purchases = result.data ?? [];
  const activePurchases = purchases.filter((p) => p.isActive && !p.isExpired);
  const inactivePurchases = purchases.filter(
    (p) => !p.isActive || p.isExpired
  );

  return (
    <PageShell
      title="My Purchases"
      description="View your enrolled batches and access status."
    >
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Total Enrollments</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {purchases.length}
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Active Access</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-700">
              {activePurchases.length}
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Expired / Cancelled</p>
            <p className="mt-1 text-2xl font-semibold text-slate-500">
              {inactivePurchases.length}
            </p>
          </div>
        </div>

        {!result.success ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {result.message}
          </div>
        ) : purchases.length === 0 ? (
          <div className="rounded-3xl border border-dashed bg-white p-10 text-center">
            <h2 className="text-xl font-semibold text-slate-900">
              No enrollments yet
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              You have not been enrolled in any batches yet. Contact your admin
              or browse available tests.
            </p>
            <Link
              href="/student/tests"
              className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Browse Tests
            </Link>
          </div>
        ) : (
          <>
            {/* Active enrollments */}
            {activePurchases.length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Active Enrollments
                </h2>
                {activePurchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700 ring-1 ring-blue-200">
                            {purchase.batch.examType}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 font-semibold ring-1 ${statusBadgeClass(
                              purchase.isActive,
                              purchase.isExpired
                            )}`}
                          >
                            {statusLabel(purchase.status, purchase.isExpired)}
                          </span>
                          {purchase.batch.isPaid ? (
                            <span className="rounded-full bg-rose-50 px-3 py-1 font-medium text-rose-700 ring-1 ring-rose-200">
                              Paid
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600 ring-1 ring-slate-200">
                              Free
                            </span>
                          )}
                        </div>

                        <h3 className="mt-3 text-xl font-semibold text-slate-900">
                          {purchase.batch.title}
                        </h3>
                      </div>

                      <Link
                        href="/student/tests"
                        className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        View Tests
                      </Link>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Enrolled Since
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {formatDate(purchase.validFrom)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Valid Until
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {formatDate(purchase.validUntil)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Payment
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {purchase.payment?.gateway === "MANUAL"
                            ? "Admin Enrollment"
                            : purchase.payment
                            ? "Online Payment"
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Inactive / past enrollments */}
            {inactivePurchases.length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-500">
                  Past Enrollments
                </h2>
                {inactivePurchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="rounded-3xl border border-slate-100 bg-slate-50 p-5 opacity-75"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-700">
                          {purchase.batch.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {purchase.batch.examType} ·{" "}
                          {formatDate(purchase.validFrom)} —{" "}
                          {formatDate(purchase.validUntil)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(
                          purchase.isActive,
                          purchase.isExpired
                        )}`}
                      >
                        {statusLabel(purchase.status, purchase.isExpired)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </PageShell>
  );
}