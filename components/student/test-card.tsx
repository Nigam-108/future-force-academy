import Link from "next/link";

type TestCardProps = {
  id: string;
  title: string;
  exam: string;
  type: "Free" | "Paid";
  status: "Live" | "Upcoming" | "Completed" | "Practice";
};

export function TestCard({ id, title, exam, type, status }: TestCardProps) {
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{type}</span>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{status}</span>
      </div>
      <h3 className="mt-4 text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{exam}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={`/student/tests/${id}/instructions`} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          View Instructions
        </Link>
        <button className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Save</button>
      </div>
    </div>
  );
}