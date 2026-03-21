"use client";

import { usePathname } from "next/navigation";
import { StudentSidebar } from "@/components/layout/student-sidebar";
import { StudentTopbar } from "@/components/layout/student-topbar";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isExamFocusedPage =
    pathname.includes("/student/tests/") &&
    (pathname.endsWith("/instructions") ||
      pathname.endsWith("/attempt") ||
      pathname.endsWith("/submitted"));

  return (
    <div className="min-h-screen bg-slate-50">
      {!isExamFocusedPage && <StudentSidebar />}

      <div
        className={`flex min-h-screen flex-col ${
          !isExamFocusedPage ? "xl:ml-64" : ""
        }`}
      >
        {!isExamFocusedPage && <StudentTopbar />}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}