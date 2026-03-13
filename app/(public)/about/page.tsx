import { PageShell } from "@/components/shared/page-shell";

export default function AboutPage() {
  return (
    <PageShell
      title="About Future Force Academy"
      description="A structured exam platform built for serious aspirants across multiple competitive exams."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-2xl font-semibold text-slate-900">Who We Are</h2>
          <p className="mt-4 text-slate-600">
            Future Force Academy is designed to provide structured test practice, exam-focused mock series,
            and a smooth digital experience for aspirants preparing for competitive exams.
          </p>
          <p className="mt-4 text-slate-600">
            The platform focuses on clean test delivery, strong admin control, multi-exam structure,
            and future-ready expansion without rebuilding the foundation.
          </p>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Why Choose Us</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>• Exam-focused practice structure</li>
              <li>• Multilingual support</li>
              <li>• Free + paid test ecosystem</li>
              <li>• Admin-controlled test delivery</li>
            </ul>
          </div>
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Student Benefits</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>• Easy dashboard access</li>
              <li>• Live and practice test support</li>
              <li>• Result tracking</li>
              <li>• Structured purchases and saved tests</li>
            </ul>
          </div>
        </div>
      </div>
    </PageShell>
  );
}