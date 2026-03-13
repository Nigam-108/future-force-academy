export function TestBuilderForm() {
  return (
    <div className="space-y-6 rounded-3xl border bg-white p-8 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Step 1: Basic Details</h2>
        <p className="mt-1 text-sm text-slate-500">Set test title, exam selection, mode, and initial structure.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <input className="rounded-xl border px-4 py-3" placeholder="Test title" />

        <select className="rounded-xl border px-4 py-3">
          <option>Select exam/category</option>
          <option>Wireless PSI & Technical Operator</option>
          <option>UPSC</option>
          <option>GPSC</option>
          <option>Railway Exams</option>
        </select>

        <select className="rounded-xl border px-4 py-3">
          <option>Test mode</option>
          <option>Practice</option>
          <option>Live</option>
          <option>Assigned</option>
        </select>

        <select className="rounded-xl border px-4 py-3">
          <option>Structure type</option>
          <option>Single</option>
          <option>Sectional</option>
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <select className="rounded-xl border px-4 py-3">
          <option>Question type mix</option>
          <option>Single Correct</option>
          <option>True / False</option>
          <option>Assertion-Reason</option>
          <option>Mixed</option>
        </select>

        <input className="rounded-xl border px-4 py-3" placeholder="Total questions" />
        <input className="rounded-xl border px-4 py-3" placeholder="Duration in minutes" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <input className="rounded-xl border px-4 py-3" placeholder="Positive marks" />
        <input className="rounded-xl border px-4 py-3" placeholder="Negative marks" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <select className="rounded-xl border px-4 py-3">
          <option>Timer mode</option>
          <option>Full Test</option>
          <option>Section-wise</option>
        </select>

        <select className="rounded-xl border px-4 py-3">
          <option>Visibility</option>
          <option>Draft</option>
          <option>Live</option>
          <option>Closed</option>
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <input className="rounded-xl border px-4 py-3" placeholder="Start date/time" />
        <input className="rounded-xl border px-4 py-3" placeholder="End date/time" />
      </div>

      <div className="flex flex-wrap gap-3">
        <button className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          Save Draft
        </button>
        <button className="rounded-xl border px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
          Next Step
        </button>
      </div>
    </div>
  );
}
