import Link from "next/link";
import { notFound } from "next/navigation";

import { PageShell } from "@/components/shared/page-shell";
import { getStudentTestById } from "@/lib/server-api";

export const dynamic = "force-dynamic";

type TestInstructionsPageProps = {
  params: Promise<{
    testId: string;
  }>;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMarks(value: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function canStartTest(status: "AVAILABLE" | "UPCOMING" | "LIVE" | "COMPLETED") {
  return status === "AVAILABLE" || status === "LIVE";
}

export default async function TestInstructionsPage({
  params,
}: TestInstructionsPageProps) {
  const { testId } = await params;
  const result = await getStudentTestById(testId);

  if (!result.success && result.status === 404) {
    notFound();
  }

  const test = result.data;

  return (
    <PageShell
      title="Test Instructions"
      description="Review the real test details carefully before you continue to the attempt page."
    >
      {!result.success || !test ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          {result.message}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-6">
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                    Future Force Academy
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    {test.title}
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                    {test.description?.trim() ||
                      "No extra description has been added for this test yet."}
                  </p>
                </div>

                <Link
                  href="/student/tests"
                  className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Back to Tests
                </Link>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="text-sm text-slate-500">Total Questions</div>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  {test._count?.testQuestions ?? test.totalQuestions}
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="text-sm text-slate-500">Total Marks</div>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  {test.totalMarks}
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="text-sm text-slate-500">Total Time</div>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  {test.durationInMinutes ?? "—"} Minutes
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="text-sm text-slate-500">Student Status</div>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  {test.studentStatus}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                Important Rules
              </h3>

              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                <li>• One attempt per student is currently allowed for each test.</li>
                <li>• If your session gets interrupted, the system is designed to resume the same attempt flow.</li>
                <li>• Auto-submit and final result logic are handled by the backend once you complete the attempt.</li>
                <li>• Start timing and live window behavior depend on the current real test status.</li>
                <li>• Keep your preferred language and internet connection ready before starting.</li>
              </ul>
            </div>

            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Sections</h3>

              {test.sections.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">
                  No section rows are configured for this test yet.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {test.sections.map((section) => (
                    <div
                      key={section.id}
                      className="rounded-2xl border bg-slate-50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="text-base font-semibold text-slate-900">
                            {section.title}
                          </h4>
                          <p className="mt-1 text-sm text-slate-600">
                            {section.totalQuestions} questions
                            {section.durationInMinutes
                              ? ` · ${section.durationInMinutes} minutes`
                              : ""}
                          </p>
                        </div>

                        <div className="text-right text-sm text-slate-600">
                          <div>+{formatMarks(section.positiveMarks)}</div>
                          <div>-{formatMarks(section.negativeMarks)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="rounded-3xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Test Details</h3>

            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex items-start justify-between gap-4 border-b pb-3">
                <dt className="text-slate-500">Mode</dt>
                <dd className="font-medium text-slate-900">{test.mode}</dd>
              </div>

              <div className="flex items-start justify-between gap-4 border-b pb-3">
                <dt className="text-slate-500">Structure</dt>
                <dd className="font-medium text-slate-900">{test.structureType}</dd>
              </div>

              <div className="flex items-start justify-between gap-4 border-b pb-3">
                <dt className="text-slate-500">Visibility</dt>
                <dd className="font-medium text-slate-900">
                  {test.visibilityStatus}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4 border-b pb-3">
                <dt className="text-slate-500">Start Time</dt>
                <dd className="text-right font-medium text-slate-900">
                  {formatDateTime(test.startAt)}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">End Time</dt>
                <dd className="text-right font-medium text-slate-900">
                  {formatDateTime(test.endAt)}
                </dd>
              </div>
            </dl>

            <div className="mt-6">
              {canStartTest(test.studentStatus) ? (
                <Link
                  href={`/student/tests/${test.id}/attempt`}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Start Test
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl bg-slate-200 px-4 py-3 text-sm font-medium text-slate-500"
                >
                  {test.studentStatus === "UPCOMING"
                    ? "Test Not Started Yet"
                    : "Test Not Available To Start"}
                </button>
              )}
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              This button state is driven by the real backend student test status
              instead of static mock UI.
            </p>
          </aside>
        </div>
      )}
    </PageShell>
  );
}