export function TrustSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Why Choose Us</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div>
            <h3 className="font-semibold text-slate-900">Exam-Focused Practice</h3>
            <p className="mt-2 text-sm text-slate-600">
              Structured mock tests designed for real competitive exam patterns.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Admin-Controlled Test Flow</h3>
            <p className="mt-2 text-sm text-slate-600">
              Flexible timing, result publishing, question control, and multilingual setup.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Multi-Exam Expansion Ready</h3>
            <p className="mt-2 text-sm text-slate-600">
              Built to support many exam categories without changing the core structure.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}