import { PageShell } from "@/components/shared/page-shell";
import { UpcomingTestCard } from "@/components/student/upcoming-test-card";

const upcomingTests = [
  {
    title: "WPSI Live Test 04",
    exam: "Wireless PSI & Technical Operator",
    date: "15 March 2026 · 10:00 AM",
    status: "Upcoming"
  },
  {
    title: "GPSC Full-Length Test",
    exam: "GPSC",
    date: "18 March 2026 · 09:30 AM",
    status: "Upcoming"
  },
  {
    title: "UPSC CSAT Timed Mock",
    exam: "UPSC",
    date: "20 March 2026 · 08:00 AM",
    status: "Upcoming"
  }
];

export default function UpcomingTestsPage() {
  return (
    <PageShell title="Upcoming Tests" description="Keep track of your upcoming live tests with time and exam details.">
      <div className="grid gap-6 lg:grid-cols-2">
        {upcomingTests.map((test) => (
          <UpcomingTestCard key={test.title} {...test} />
        ))}
      </div>
    </PageShell>
  );
}