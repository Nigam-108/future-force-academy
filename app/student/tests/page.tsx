import { PageShell } from "@/components/shared/page-shell";
import { TestCard } from "@/components/student/test-card";

const tests = [
  { id: "test-1", title: "WPSI Full Mock Test 01", exam: "Wireless PSI & Technical Operator", type: "Paid", status: "Live" },
  { id: "test-2", title: "UPSC CSAT Practice Test", exam: "UPSC", type: "Free", status: "Practice" },
  { id: "test-3", title: "GPSC Sectional Aptitude Test", exam: "GPSC", type: "Paid", status: "Upcoming" },
  { id: "test-4", title: "Railway Group D Starter Test", exam: "Railway Exams", type: "Free", status: "Completed" }
] as const;

export default function StudentTestsPage() {
  return (
    <PageShell title="Tests" description="Search, filter, and access your live, practice, and upcoming tests.">
      <div className="mb-6 grid gap-4 rounded-3xl border bg-white p-5 shadow-sm lg:grid-cols-4">
        <input className="rounded-xl border px-4 py-3" placeholder="Search by test name" />
        <select className="rounded-xl border px-4 py-3">
          <option>All Exams</option>
          <option>Wireless PSI & Technical Operator</option>
          <option>UPSC</option>
          <option>GPSC</option>
          <option>Railway Exams</option>
        </select>
        <select className="rounded-xl border px-4 py-3">
          <option>All Access</option>
          <option>Free</option>
          <option>Paid</option>
        </select>
        <select className="rounded-xl border px-4 py-3">
          <option>All Status</option>
          <option>Live</option>
          <option>Upcoming</option>
          <option>Completed</option>
          <option>Practice</option>
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {tests.map((test) => (
          <TestCard key={test.id} {...test} />
        ))}
      </div>
    </PageShell>
  );
}