import { PageShell } from "@/components/shared/page-shell";

const templates = [
  { title: "WPSI Full Mock Template", info: "100 questions · sectional · negative marking" },
  { title: "UPSC CSAT Practice Template", info: "80 questions · single section" },
  { title: "GPSC Aptitude Template", info: "60 questions · sectional" }
];

export default function TestTemplatesPage() {
  return (
    <PageShell title="Test Templates" description="Reuse previously created templates and clone old test structures.">
      <div className="space-y-4">
        {templates.map((template) => (
          <div key={template.title} className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{template.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{template.info}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                Use Template
              </button>
              <button className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Clone Old Test
              </button>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
