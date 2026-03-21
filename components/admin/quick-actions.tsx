import Link from "next/link";
import {
  BookPlus,
  FileUp,
  LayoutGrid,
  Megaphone,
  PlusCircle,
  Users,
} from "lucide-react";

const actions = [
  {
    label: "Create Test",
    href: "/admin/tests/new",
    icon: PlusCircle,
    color: "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200",
  },
  {
    label: "Add Question",
    href: "/admin/questions/new",
    icon: BookPlus,
    color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200",
  },
  {
    label: "Import Questions",
    href: "/admin/questions/import",
    icon: FileUp,
    color: "bg-violet-50 text-violet-700 hover:bg-violet-100 border-violet-200",
  },
  {
    label: "View Payments",
    href: "/admin/payments",
    icon: LayoutGrid,
    color: "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200",
  },
  {
    label: "Manage Students",
    href: "/admin/students",
    icon: Users,
    color: "bg-pink-50 text-pink-700 hover:bg-pink-100 border-pink-200",
  },
  {
    label: "Announcements",
    href: "/admin/announcements",
    icon: Megaphone,
    color: "bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border-cyan-200",
  },
];

export function AdminQuickActions() {
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${action.color}`}
            >
              <Icon size={18} className="shrink-0" />
              <span>{action.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}