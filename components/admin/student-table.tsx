const students = [
  {
    id: "S-1001",
    name: "Nigam Student",
    email: "nigam@example.com",
    status: "Active",
    course: "Wireless PSI & Technical Operator"
  },
  {
    id: "S-1002",
    name: "Aarav Patel",
    email: "aarav@example.com",
    status: "Active",
    course: "GPSC"
  },
  {
    id: "S-1003",
    name: "Riya Shah",
    email: "riya@example.com",
    status: "Blocked",
    course: "UPSC"
  }
];

export function StudentTable() {
  return (
    <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">ID</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Student</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Course</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student) => (
              <tr key={student.id}>
                <td className="px-5 py-4 text-sm font-medium text-slate-900">{student.id}</td>
                <td className="px-5 py-4 text-sm text-slate-700">{student.name}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{student.email}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{student.course}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{student.status}</td>
                <td className="px-5 py-4 text-right">
                  <button className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                    View
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
