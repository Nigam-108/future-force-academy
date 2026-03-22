"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (window.innerWidth >= 1280) setSidebarOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Backdrop for mobile */}
      <div
        className={`fixed inset-0 bg-black/40 z-20 xl:hidden transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div
        className={`flex min-h-screen flex-col transition-all duration-300 ease-in-out ${
          sidebarOpen ? "xl:ml-64" : "xl:ml-0"
        }`}
      >
        <AdminTopbar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen((prev) => !prev)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}