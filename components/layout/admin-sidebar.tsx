import Link from "next/link";
import { adminNavItems } from "@/lib/constants/navigation";
import Image from "next/image";

export function AdminSidebar() {
  return (
    <aside className="hidden w-72 border-r bg-slate-950 text-white xl:block">
      <div className="p-6">
        <div className="rounded-2xl bg-white/10 p-4">
  <div className="flex items-center gap-3">
    <Image src="/logos/logo.png" alt="Future Force Academy Logo" width={44} height={44} className="h-11 w-11 rounded-2xl object-contain bg-white p-1"/>
    <div>
      <h2 className="text-lg font-bold">Admin Panel</h2>
      <p className="mt-1 text-sm text-slate-300">Future Force Academy</p>
    </div>
  </div>
</div>

        <nav className="mt-6 flex flex-col gap-2">
          {adminNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}