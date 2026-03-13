export function FilterBar({ children }: { children: React.ReactNode }) {
  return <div className="mb-6 grid gap-4 rounded-3xl border bg-white p-5 shadow-sm lg:grid-cols-4">{children}</div>;
}
