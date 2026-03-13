export function QuestionForm() {
  return (
    <form className="space-y-6 rounded-3xl border bg-white p-8 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-2">
        <select className="rounded-xl border px-4 py-3">
          <option>Select Exam/Course</option>
          <option>Wireless PSI & Technical Operator</option>
          <option>UPSC</option>
          <option>GPSC</option>
          <option>Railway Exams</option>
        </select>

        <select className="rounded-xl border px-4 py-3">
          <option>Select Question Type</option>
          <option>Single Correct</option>
          <option>True / False</option>
          <option>Assertion-Reason</option>
          <option>Multi Correct</option>
          <option>Match the Following</option>
        </select>
      </div>

      <textarea className="min-h-32 w-full rounded-xl border px-4 py-3" placeholder="Enter question text" />

      <div className="grid gap-4 lg:grid-cols-2">
        <input className="rounded-xl border px-4 py-3" placeholder="Option A" />
        <input className="rounded-xl border px-4 py-3" placeholder="Option B" />
        <input className="rounded-xl border px-4 py-3" placeholder="Option C" />
        <input className="rounded-xl border px-4 py-3" placeholder="Option D" />
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <select className="rounded-xl border px-4 py-3">
          <option>Correct Answer</option>
          <option>A</option>
          <option>B</option>
          <option>C</option>
          <option>D</option>
        </select>

        <select className="rounded-xl border px-4 py-3">
          <option>Difficulty</option>
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>

        <input className="rounded-xl border px-4 py-3" placeholder="Subject" />
        <input className="rounded-xl border px-4 py-3" placeholder="Topic" />
      </div>

      <textarea className="min-h-28 w-full rounded-xl border px-4 py-3" placeholder="Explanation / Solution" />
      <input className="w-full rounded-xl border px-4 py-3" placeholder="Tags / labels" />

      <div className="grid gap-4 lg:grid-cols-2">
        <select className="rounded-xl border px-4 py-3">
          <option>Language: English</option>
          <option>Gujarati</option>
          <option>Hindi</option>
        </select>
        <button type="button" className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
          Upload Image (later)
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <button className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          Save Question
        </button>
        <button type="button" className="rounded-xl border px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
          Cancel
        </button>
      </div>
    </form>
  );
}
