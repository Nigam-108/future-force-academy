import { PageShell } from "@/components/shared/page-shell";

const importErrors = [
  { row: 2, issue: "Missing question text" },
  { row: 5, issue: "Invalid question type value" },
  { row: 8, issue: "Correct answer field empty" }
];

export default function ImportQuestionsPage() {
  return (
    <PageShell title="Import Questions" description="Upload Excel or CSV files and review row-wise validation errors.">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Upload File</h2>
          <div className="mt-5 rounded-2xl border border-dashed p-8 text-center text-sm text-slate-600">
            Drag and drop your Excel/CSV file here or click to upload.
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              Upload File
            </button>
            <button className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Download Sample Format
            </button>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Validation Results</h2>
          <div className="mt-5 space-y-3">
            {importErrors.map((item) => (
              <div key={item.row} className="rounded-2xl border p-4 text-sm text-slate-700">
                <span className="font-semibold text-slate-900">Row {item.row}:</span> {item.issue}
              </div>
            ))}
          </div>
          <button className="mt-5 rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Re-upload Corrected File
          </button>
        </div>
      </div>
    </PageShell>
  );
}
