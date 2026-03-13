import { QuestionPalette } from "@/components/student/question-palette";
import { TestTimerBar } from "@/components/student/test-timer-bar";

export default function TestAttemptPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <TestTimerBar />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.48fr]">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Question 1 of 100</p>
              <h1 className="text-2xl font-semibold text-slate-900">
                Which of the following is the correct next number in the series?
              </h1>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              Section: Aptitude
            </span>
          </div>

          <div className="rounded-2xl bg-slate-50 p-5 text-slate-700">
            12, 24, 48, 96, ?
          </div>

          <div className="mt-6 space-y-3">
            {["144", "168", "192", "200"].map((option, index) => (
              <button
                key={option}
                className="flex w-full items-start gap-4 rounded-2xl border px-5 py-4 text-left transition hover:bg-slate-50"
              >
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="text-slate-700">{option}</span>
              </button>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Previous
            </button>
            <button className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Mark for Review
            </button>
            <button className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
              Next
            </button>
            <button className="ml-auto rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700">
              Submit Test
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <QuestionPalette />
          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              Section Navigation
            </h3>
            <div className="mt-4 space-y-3 text-sm">
              <button className="w-full rounded-xl bg-blue-50 px-4 py-3 text-left font-semibold text-blue-700">
                Aptitude
              </button>
              <button className="w-full rounded-xl border px-4 py-3 text-left font-semibold text-slate-700">
                Reasoning
              </button>
              <button className="w-full rounded-xl border px-4 py-3 text-left font-semibold text-slate-700">
                Subject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}