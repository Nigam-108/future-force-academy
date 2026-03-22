"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { StudentSidebar } from "@/components/layout/student-sidebar";
import { StudentTopbar } from "@/components/layout/student-topbar";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isExamFocusedPage =
    pathname.includes("/student/tests/") &&
    (pathname.endsWith("/instructions") ||
      pathname.endsWith("/attempt") ||
      pathname.endsWith("/submitted"));

  useEffect(() => {
    if (window.innerWidth >= 1280) setSidebarOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Backdrop for mobile */}
      {!isExamFocusedPage && (
        <div
          className={`fixed inset-0 bg-black/40 z-20 xl:hidden transition-opacity duration-300 ${
            sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {!isExamFocusedPage && (
        <StudentSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`flex min-h-screen flex-col transition-all duration-300 ease-in-out ${
          !isExamFocusedPage && sidebarOpen ? "xl:ml-64" : "xl:ml-0"
        }`}
      >
        {!isExamFocusedPage && (
          <StudentTopbar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen((prev) => !prev)}
          />
        )}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}