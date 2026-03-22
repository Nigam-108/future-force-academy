"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogOut, Settings, User } from "lucide-react";

type TopbarProps = {
  isOpen: boolean;
  onToggle: () => void;
};

type CurrentUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};

function getStudentPageTitle(pathname: string): string {
  if (pathname === "/student/dashboard") return "Dashboard";
  if (pathname.startsWith("/student/tests") && pathname.includes("/attempt")) return "Test Attempt";
  if (pathname.startsWith("/student/tests/")) return "Test Details";
  if (pathname === "/student/tests") return "Tests";
  if (pathname.startsWith("/student/results/")) return "Result Details";
  if (pathname === "/student/results") return "Results";
  if (pathname === "/student/purchases") return "My Enrollments";
  if (pathname === "/student/payments") return "Payment History";
  if (pathname === "/student/saved") return "Saved Tests";
  if (pathname === "/student/profile") return "Profile";
  if (pathname === "/student/upcoming-tests") return "Upcoming Tests";
  return "Student Portal";
}

function HamburgerToggle({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="group relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      style={{ transition: "transform 0.12s ease, background-color 0.2s ease, color 0.2s ease" }}
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
    >
      <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 ring-1 ring-blue-200" />

      <span className="relative flex flex-col items-center justify-center w-[18px] h-[14px]">
        {/* Top line */}
        <span
          className="absolute block h-[2px] rounded-full bg-current"
          style={{
            width: "18px",
            transformOrigin: "center",
            transform: isOpen ? "rotate(45deg) translateY(0px)" : "rotate(0deg) translateY(-6px)",
            transition: isOpen
              ? "transform 340ms cubic-bezier(0.68,-0.6,0.32,1.6)"
              : "transform 340ms cubic-bezier(0.68,-0.6,0.32,1.6) 40ms",
          }}
        />
        {/* Middle line */}
        <span
          className="absolute block h-[2px] rounded-full bg-current"
          style={{
            transformOrigin: "center",
            width: isOpen ? "0px" : "13px",
            opacity: isOpen ? 0 : 1,
            transition: isOpen
              ? "width 220ms ease 0ms, opacity 180ms ease 0ms"
              : "width 220ms ease 80ms, opacity 180ms ease 80ms",
          }}
        />
        {/* Bottom line */}
        <span
          className="absolute block h-[2px] rounded-full bg-current"
          style={{
            width: "18px",
            transformOrigin: "center",
            transform: isOpen ? "rotate(-45deg) translateY(0px)" : "rotate(0deg) translateY(6px)",
            transition: isOpen
              ? "transform 340ms cubic-bezier(0.68,-0.6,0.32,1.6)"
              : "transform 340ms cubic-bezier(0.68,-0.6,0.32,1.6) 40ms",
          }}
        />
      </span>
    </button>
  );
}

function StudentProfileButton() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.success && d.data) setUser(d.data as CurrentUser); })
      .catch(() => null);
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const initials = user?.fullName?.charAt(0).toUpperCase() ?? "S";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-md ring-2 ring-white transition-all hover:shadow-lg hover:ring-blue-200 focus:outline-none"
        title={user?.fullName ?? "Profile"}
      >
        {initials}
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          {user ? (
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{user.fullName}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
            </div>
          ) : null}
          <div className="p-1.5">
            <Link href="/student/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
              <User size={16} className="shrink-0 text-slate-400" />
              View Profile
            </Link>
            <Link href="/student/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
              <Settings size={16} className="shrink-0 text-slate-400" />
              Edit Profile
            </Link>
            <div className="my-1 border-t border-slate-100" />
            <button type="button" onClick={() => void handleLogout()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50">
              <LogOut size={16} className="shrink-0" />
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function StudentTopbar({ isOpen, onToggle }: TopbarProps) {
  const pathname = usePathname();
  const title = getStudentPageTitle(pathname);

  return (
    <div className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <HamburgerToggle isOpen={isOpen} onToggle={onToggle} />
          <Link href="/" className="hidden sm:flex shrink-0">
            <Image src="/logos/logo.png" alt="Future Force Academy" width={40} height={40} className="h-10 w-10 rounded-xl bg-slate-950 object-contain p-1" />
          </Link>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">Future Force Academy</p>
            <h1 className="text-base font-semibold text-slate-900">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center rounded-xl border bg-white px-3 py-1.5 text-xs font-medium text-slate-600 sm:flex">
            EN / GU / HI
          </div>
          <StudentProfileButton />
        </div>
      </div>
    </div>
  );
}