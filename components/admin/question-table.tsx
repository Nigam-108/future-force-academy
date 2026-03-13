const questions = [
  {
    id: "Q-101",
    question: "What is the full form of CPU?",
    type: "Single Correct",
    difficulty: "Easy",
    status: "Active"
  },
  {
    id: "Q-102",
    question: "A transistor is mainly used for which purpose?",
    type: "Single Correct",
    difficulty: "Medium",
    status: "Approved"
  },
  {
    id: "Q-103",
    question: "Assertion-Reason question example",
    type: "Assertion-Reason",
    difficulty: "Hard",
    status: "Draft"
  }
];

export function QuestionTable() {
  return (
    <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">ID</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Question</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Difficulty</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {questions.map((item) => (
              <tr key={item.id}>
                <td className="px-5 py-4 text-sm font-medium text-slate-900">{item.id}</td>
                <td className="px-5 py-4 text-sm text-slate-700">{item.question}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{item.type}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{item.difficulty}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{item.status}</td>
                <td className="px-5 py-4 text-right">
                  <button className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}