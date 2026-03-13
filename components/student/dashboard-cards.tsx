const studentCards = [
  { title: "Enrolled Tests", value: "12" },
  { title: "Upcoming Tests", value: "4" },
  { title: "Past Results", value: "18" },
  { title: "Saved Tests", value: "6" }
];

export function DashboardCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {studentCards.map((card) => (
        <div key={card.title} className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">{card.title}</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{card.value}</p>
        </div>
      ))}
    </div>
  );
}