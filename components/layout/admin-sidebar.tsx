"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { adminNavGroups } from "@/lib/constants/navigation";

export function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin/dashboard") return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-950 xl:flex xl:flex-col">
      {/* ── Brand header ── */}
      <div className="border-b border-slate-800 p-5">
        <div className="flex items-center gap-3">
          <Image
            src="/logos/logo.png"
            alt="Future Force Academy"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-xl bg-white object-contain p-1"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">
              Future Force Academy
            </p>
            <p className="text-xs text-slate-400">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* ── Navigation groups ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {adminNavGroups.map((group) => (
            <div key={group.groupLabel}>
              {/* Group label */}
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                {group.groupLabel}
              </p>

              {/* Group items */}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-white/10 text-white"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                      }`}
                    >
                      {/* Active indicator bar */}
                      <span
                        className={`mr-0.5 h-4 w-0.5 shrink-0 rounded-full transition-colors ${
                          active ? "bg-blue-400" : "bg-transparent"
                        }`}
                      />
                      <Icon
                        size={16}
                        className={`shrink-0 ${
                          active ? "text-blue-400" : "text-slate-500"
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* ── Footer ── */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
            A
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white">
              Main Admin
            </p>
            <p className="truncate text-[10px] text-slate-400">
              admin@futureforceacademy.com
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}