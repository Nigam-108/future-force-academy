import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";
import { fetchInternalApi } from "@/lib/server-api";

type AdminStudentDetailResponse = {
  student: {
    id: string;
    fullName: string;
    email: string;
    mobileNumber: string | null;
    preferredLanguage: string;
    emailVerified: boolean;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  stats: {
    submittedAttemptsCount: number;
    inProgressAttemptsCount: number;
    totalAttempts: number;
  };
  recentAttempts: Array<{
    id: string;
    status: string;
    createdAt: string;
    test: {
      id: string;
      title: string;
      slug: string;
      mode: string;
      totalMarks: number;
    };
  }>;
};

type PurchaseHistoryResponse = {
  user: { id: string; fullName: string; email: string };
  payments: Array<{
    id: string;
    amountFormatted: string;
    status: string;
    gateway: string;
    paidAt: string | null;
    createdAt: string;
    notes: string | null;
    batch: {
      id: string;
      title: string;
      examType: string;
    };
  }>;
  purchases: Array<{
    id: string;
    status: string;
    validFrom: string;
    validUntil: string | null;
    createdAt: string;
    batch: {
      id: string;
      title: string;
      examType: string;
    };
    payment: {
      gateway: string;
      amount: number;
    } | null;
  }>;
  totalPayments: number;
  totalPurchases: number;
  activePurchases: number;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "SUCCESS":
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "PENDING":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "FAILED":
    case "CANCELLED":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    case "REFUNDED":
    case "EXPIRED":
      return "bg-slate-100 text-slate-600 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

function formatAmount(gateway: string, amount: number) {
  if (gateway === "MANUAL" && amount === 0) return "Admin Enrollment";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount / 100);
}

export default async function AdminStudentDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [studentResult, purchaseResult] = await Promise.all([
    fetchInternalApi<AdminStudentDetailResponse>(
      `/api/admin/students/${id}`
    ),
    fetchInternalApi<PurchaseHistoryResponse>(
      `/api/admin/students/${id}/purchases`
    ),
  ]);

  if (!studentResult.success || !studentResult.data) {
    return (
      <PageShell
        title="Student Details"
        description="View student profile and recent attempts."
      >
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">{studentResult.message}</p>
        </div>
      </PageShell>
    );
  }

  const { student, stats, recentAttempts } = studentResult.data;
  const purchaseHistory = purchaseResult.data;

  return (
    <PageShell
      title="Student Details"
      description="View student profile, attempts, and purchase history."
    >
      {/* Navigation */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/admin/students"
          className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ← Back to Students
        </Link>
        <Link
          href={`/admin/students/${id}/batches`}
          className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Assign Batches
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Total Attempts</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {stats.totalAttempts}
          </p>
        </div>
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Submitted</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">
            {stats.submittedAttemptsCount}
          </p>
        </div>
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">In Progress</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {stats.inProgressAttemptsCount}
          </p>
        </div>
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Total Payments</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {purchaseHistory?.totalPayments ?? 0}
          </p>
        </div>
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Active Enrollments</p>
          <p className="mt-2 text-3xl font-bold text-blue-700">
            {purchaseHistory?.activePurchases ?? 0}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left column */}
        <div className="space-y-6">

          {/* Student profile */}
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Student Profile
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Full Name</p>
                <p className="mt-1 font-medium text-slate-900">
                  {student.fullName}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Email</p>
                <p className="mt-1 font-medium text-slate-900">
                  {student.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Mobile</p>
                <p className="mt-1 font-medium text-slate-900">
                  {student.mobileNumber ?? "Not set"}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Preferred Language</p>
                <p className="mt-1 font-medium text-slate-900">
                  {student.preferredLanguage}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                    student.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      : "bg-rose-50 text-rose-700 ring-rose-200"
                  }`}
                >
                  {student.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-slate-500">Email Verified</p>
                <p className="mt-1 font-medium text-slate-900">
                  {student.emailVerified ? "Yes" : "No"}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Joined</p>
                <p className="mt-1 font-medium text-slate-900">
                  {formatDateTime(student.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Purchase / enrollment history */}
          {purchaseHistory ? (
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Batch Enrollments
              </h2>

              {purchaseHistory.purchases.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">
                  No batch enrollments found.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {purchaseHistory.purchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {purchase.batch.title}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {purchase.batch.examType} ·{" "}
                            {purchase.payment
                              ? formatAmount(
                                  purchase.payment.gateway,
                                  purchase.payment.amount
                                )
                              : "—"}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            From {formatDateTime(purchase.validFrom)}
                            {purchase.validUntil
                              ? ` → ${formatDateTime(purchase.validUntil)}`
                              : " (no expiry)"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(
                            purchase.status
                          )}`}
                        >
                          {purchase.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {/* Payment history */}
          {purchaseHistory && purchaseHistory.payments.length > 0 ? (
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Payment History
              </h2>

              <div className="mt-4 space-y-3">
                {purchaseHistory.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {payment.amountFormatted}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {payment.batch.title} · {payment.gateway}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatDateTime(payment.paidAt ?? payment.createdAt)}
                      </p>
                      {payment.notes ? (
                        <p className="mt-0.5 text-xs text-slate-400 italic">
                          {payment.notes}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(
                          payment.status
                        )}`}
                      >
                        {payment.status}
                      </span>
                      <Link
                        href={`/admin/payments/${payment.id}`}
                        className="rounded-xl border px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Right column — recent attempts */}
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Attempts
          </h2>
          <div className="mt-4 space-y-4">
            {recentAttempts.length === 0 ? (
              <p className="text-sm text-slate-600">No attempts found.</p>
            ) : (
              recentAttempts.map((attempt) => (
                <div key={attempt.id} className="rounded-2xl border p-4">
                  <p className="font-semibold text-slate-900">
                    {attempt.test.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Status:{" "}
                    <span
                      className={
                        attempt.status === "SUBMITTED"
                          ? "font-medium text-emerald-700"
                          : attempt.status === "IN_PROGRESS"
                          ? "font-medium text-amber-600"
                          : "text-slate-600"
                      }
                    >
                      {attempt.status}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatDateTime(attempt.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}