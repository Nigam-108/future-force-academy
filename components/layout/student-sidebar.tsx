import Link from "next/link";
import { studentNavItems } from "@/lib/constants/navigation";

export function StudentSidebar() {
  return (
    <aside className="hidden w-72 border-r bg-white xl:block">
      <div className="p-6">
        <h2 className="text-lg font-bold text-slate-900">Student Panel</h2>
        <nav className="mt-6 flex flex-col gap-2">
          {studentNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}