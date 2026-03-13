import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";

export default function TestInstructionsPage() {
  return (
    <PageShell title="Test Instructions" description="Read the instructions carefully before starting the test.">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">WPSI Full Mock Test 01</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border p-5">
              <p className="text-sm text-slate-500">Total Questions</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">100</p>
            </div>
            <div className="rounded-2xl border p-5">
              <p className="text-sm text-slate-500">Total Time</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">90 Minutes</p>
            </div>
          </div>
          <div className="mt-6 rounded-2xl border p-5">
            <h3 className="text-lg font-semibold text-slate-900">Marking Scheme</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• +1 for every correct answer</li>
              <li>• -0.25 for every wrong answer</li>
              <li>• Section-wise structure enabled</li>
            </ul>
          </div>
          <div className="mt-6 rounded-2xl border p-5">
            <h3 className="text-lg font-semibold text-slate-900">Important Rules</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• Start only within the allowed window</li>
              <li>• Auto-submit on timer end</li>
              <li>• Tab switching may trigger warning</li>
              <li>• Language switch available during test</li>
            </ul>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">Sections</h3>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border p-5">
              <h4 className="font-semibold text-slate-900">Section 1: Aptitude</h4>
              <p className="mt-2 text-sm text-slate-600">30 questions · 25 minutes</p>
            </div>
            <div className="rounded-2xl border p-5">
              <h4 className="font-semibold text-slate-900">Section 2: Reasoning</h4>
              <p className="mt-2 text-sm text-slate-600">35 questions · 30 minutes</p>
            </div>
            <div className="rounded-2xl border p-5">
              <h4 className="font-semibold text-slate-900">Section 3: Subject</h4>
              <p className="mt-2 text-sm text-slate-600">35 questions · 35 minutes</p>
            </div>
          </div>
          <Link href="/student/tests/test-1/attempt" className="mt-6 inline-flex w-full justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            Start Test
          </Link>
        </div>
      </div>
    </PageShell>
  );
}