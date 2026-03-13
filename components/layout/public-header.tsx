import Link from "next/link";
import { publicNavItems } from "@/lib/constants/navigation";
import Image from "next/image";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
         <Image
  src="/logos/logo.png"
  alt="Future Force Academy Logo"
  width={40}
  height={40}
  className="h-10 w-10 rounded-xl object-contain bg-slate-100 p-1"
/>
          <span>Future Force Academy</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {publicNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-700 transition hover:text-blue-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Signup
          </Link>
        </div>
      </div>
    </header>
  );
}