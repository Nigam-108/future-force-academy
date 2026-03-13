const adminStats = [
  { title: "Total Students", value: "1,248" },
  { title: "Total Tests", value: "86" },
  { title: "Total Payments", value: "312" },
  { title: "Upcoming Live Tests", value: "7" },
  { title: "Recent Registrations", value: "43" },
  { title: "Question Bank Items", value: "2,416" }
];

export function AdminStatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {adminStats.map((card) => (
        <div key={card.title} className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">{card.title}</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{card.value}</p>
        </div>
      ))}
    </div>
  );
}