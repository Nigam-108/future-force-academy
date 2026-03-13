const steps = [
  "Basic Details",
  "Question Types",
  "Structure",
  "Sections",
  "Marking",
  "Timer & Rules",
  "Questions",
  "Publish",
  "Preview"
];

export function TestBuilderStepper() {
  return (
    <div className="rounded-3xl border bg-white p-5 shadow-sm">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-9">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`rounded-2xl border px-3 py-3 text-center text-xs font-semibold ${index === 0 ? "border-blue-600 bg-blue-50 text-blue-700" : "text-slate-600"}`}
          >
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}
