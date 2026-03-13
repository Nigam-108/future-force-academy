"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

function getStudentPageMeta(pathname: string) {
  if (pathname === "/student/dashboard") {
    return {
      title: "Dashboard",
      description: "Manage your tests, results, and purchases.",
    };
  }

  if (pathname === "/student/tests") {
    return {
      title: "Tests",
      description: "Browse live, practice, and upcoming tests.",
    };
  }

  if (pathname.startsWith("/student/results")) {
    return {
      title: "Results",
      description: "Track marks, rank, and performance review.",
    };
  }

  if (pathname.startsWith("/student/purchases")) {
    return {
      title: "Purchases",
      description: "Access your purchased test series and validity details.",
    };
  }

  if (pathname === "/student/saved") {
    return {
      title: "Saved",
      description: "Your bookmarked tests and saved series.",
    };
  }

  if (pathname === "/student/profile") {
    return {
      title: "Profile",
      description: "Manage your account details and preferences.",
    };
  }

  if (pathname === "/student/upcoming-tests") {
    return {
      title: "Upcoming Tests",
      description: "Check live schedules and countdowns.",
    };
  }

  return {
    title: "Student Portal",
    description: "Future Force Academy student experience.",
  };
}

export function StudentTopbar() {
  const pathname = usePathname();
  const pageMeta = getStudentPageMeta(pathname);

  return (
    <div className="border-b bg-white px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <Link
  href="/"
  className="hidden sm:flex"
>
  <Image
    src="/logos/logo.png"
    alt="Future Force Academy Logo"
    width={48}
    height={48}
    className="h-12 w-12 rounded-2xl object-contain bg-slate-950 p-1"
  />
</Link>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-700">
              Future Force Academy
            </p>
            <h1 className="mt-1 text-lg font-semibold text-slate-900">
              {pageMeta.title}
            </h1>
            <p className="text-sm text-slate-500">{pageMeta.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
            Student Portal
          </span>
          <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
            EN / GU / HI
          </div>
        </div>
      </div>
    </div>
  );
}