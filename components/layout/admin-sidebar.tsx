"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { adminNavGroups } from "@/lib/constants/navigation";

export function AdminSidebar() {
  const pathname = usePathname();

  // Track which groups are collapsed — all open by default
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggleGroup(label: string) {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  function isGroupCollapsed(label: string) {
    return collapsed[label] === true;
  }

  function isActive(href: string) {
    if (href === "/admin/dashboard") return pathname === href;
    return pathname.startsWith(href);
  }

  // Auto-detect if any item in a group is active
  function isGroupActive(groupLabel: string) {
    const group = adminNavGroups.find((g) => g.groupLabel === groupLabel);
    return group?.items.some((item) => isActive(item.href)) ?? false;
  }

  return (
    <aside className="hidden xl:flex xl:flex-col w-64 shrink-0 fixed top-0 left-0 h-screen border-r border-slate-800 bg-slate-950 z-30">

      {/* ── Brand header — fixed, never scrolls ── */}
      <div className="shrink-0 border-b border-slate-800 p-5">
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

      {/* ── Scrollable nav area — only this scrolls ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">
        <div className="space-y-1">
          {adminNavGroups.map((group) => {
            const isOpen = !isGroupCollapsed(group.groupLabel);
            const groupHasActive = isGroupActive(group.groupLabel);
            const isSingleItem = group.items.length === 1;

            // Single-item groups (like Overview/Dashboard) render without a toggle
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
                      active
                        ? "bg-white/10 text-white"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    <span
                      className={`h-4 w-0.5 shrink-0 rounded-full transition-colors ${
                        active ? "bg-blue-400" : "bg-transparent"
                      }`}
                    />
                    <Icon
                      size={16}
                      className={`shrink-0 transition-colors ${
                        active ? "text-blue-400" : "text-slate-500"
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </div>
              );
            }

            // Multi-item groups — collapsible
            return (
              <div key={group.groupLabel} className="mb-2">

                {/* Group toggle header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.groupLabel)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 transition-colors ${
                    groupHasActive && !isOpen
                      ? "bg-white/5"
                      : "hover:bg-white/5"
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold uppercase tracking-[0.12em] transition-colors ${
                      groupHasActive
                        ? "text-blue-400"
                        : "text-slate-500 group-hover:text-slate-400"
                    }`}
                  >
                    {group.groupLabel}
                  </span>

                  <span className="flex items-center gap-1.5">
                    {/* Active dot — shows when group is collapsed but has active item */}
                    {groupHasActive && !isOpen ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    ) : null}

                    <ChevronDown
                      size={13}
                      className={`shrink-0 text-slate-500 transition-transform duration-200 ${
                        isOpen ? "rotate-0" : "-rotate-90"
                      }`}
                    />
                  </span>
                </button>

                {/* Collapsible items */}
                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="mt-0.5 space-y-0.5 pb-1 pl-1">
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
                          <span
                            className={`h-4 w-0.5 shrink-0 rounded-full transition-colors ${
                              active ? "bg-blue-400" : "bg-transparent"
                            }`}
                          />
                          <Icon
                            size={16}
                            className={`shrink-0 transition-colors ${
                              active ? "text-blue-400" : "text-slate-500"
                            }`}
                          />
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

      {/* ── Admin identity footer — fixed, never scrolls ── */}
      <div className="shrink-0 border-t border-slate-800 p-4">
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