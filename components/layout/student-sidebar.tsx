"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { studentNavGroups } from "@/lib/constants/navigation";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function StudentSidebar({ isOpen, onClose }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggleGroup(label: string) {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  function isActive(href: string) {
    if (href === "/student/dashboard") return pathname === href;
    return pathname.startsWith(href);
  }

  function isGroupActive(groupLabel: string) {
    const group = studentNavGroups.find((g) => g.groupLabel === groupLabel);
    return group?.items.some((item) => isActive(item.href)) ?? false;
  }

  function isGroupCollapsed(label: string) {
    return collapsed[label] === true;
  }

  return (
    <aside
      className={`flex flex-col w-64 shrink-0 fixed top-0 left-0 h-screen border-r border-slate-800 bg-slate-900 z-30 transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      style={{ willChange: "transform" }}
    >
      {/* Close X button — mobile only */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 xl:hidden flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors duration-200"
        aria-label="Close sidebar"
      >
        <X size={15} />
      </button>

      {/* Brand */}
      <div className="shrink-0 border-b border-slate-800 p-5">
        <div className="flex items-center gap-3">
          <Image src="/logos/logo.png" alt="Future Force Academy" width={40} height={40} className="h-10 w-10 shrink-0 rounded-xl bg-white object-contain p-1" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">Future Force Academy</p>
            <p className="text-xs text-blue-400">Student Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        <div className="space-y-1">
          {studentNavGroups.map((group) => {
            const isOpen_ = !isGroupCollapsed(group.groupLabel);
            const groupHasActive = isGroupActive(group.groupLabel);
            const isSingleItem = group.items.length === 1;

            if (isSingleItem) {
              const item = group.items[0];
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <div key={group.groupLabel} className="mb-2">
                  <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                    {group.groupLabel}
                  </p>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    <span className={`h-4 w-0.5 shrink-0 rounded-full transition-colors ${active ? "bg-blue-400" : "bg-transparent"}`} />
                    <Icon size={16} className={`shrink-0 transition-colors ${active ? "text-blue-400" : "text-slate-500"}`} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </div>
              );
            }

            return (
              <div key={group.groupLabel} className="mb-2">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.groupLabel)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 transition-colors hover:bg-white/5"
                >
                  <span className={`text-[10px] font-bold uppercase tracking-[0.12em] transition-colors ${groupHasActive ? "text-blue-400" : "text-slate-500"}`}>
                    {group.groupLabel}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {groupHasActive && !isOpen_ ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    ) : null}
                    <ChevronDown
                      size={13}
                      className={`shrink-0 text-slate-500 transition-transform duration-200 ${isOpen_ ? "rotate-0" : "-rotate-90"}`}
                    />
                  </span>
                </button>

                <div className={`overflow-hidden transition-all duration-200 ${isOpen_ ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className="mt-0.5 space-y-0.5 pb-1 pl-1">
                    {group.items.map((item) => {
                      const active = isActive(item.href);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                            active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                          }`}
                        >
                          <span className={`h-4 w-0.5 shrink-0 rounded-full transition-colors ${active ? "bg-blue-400" : "bg-transparent"}`} />
                          <Icon size={16} className={`shrink-0 transition-colors ${active ? "text-blue-400" : "text-slate-500"}`} />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-slate-800 p-4">
        <div className="rounded-xl bg-white/5 px-3 py-2.5 text-center">
          <p className="text-[10px] text-slate-500">Future Force Academy</p>
          <p className="text-xs font-medium text-slate-300">Student Portal</p>
        </div>
      </div>
    </aside>
  );
}