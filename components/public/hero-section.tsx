import Link from "next/link";
import { BRANDING } from "@/lib/constants/branding";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm text-slate-200">
            Future Force Academy
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Smart Mock Tests. Real Exam Practice. Better Results.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-300">
            Multi-exam platform for structured practice, timed mock tests, multilingual questions,
            and strong admin-controlled test delivery.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/exams"
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {BRANDING.primaryCta}
            </Link>
            <Link
              href="/signup"
              className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              {BRANDING.secondaryCta}
            </Link>
            <Link
              href="/test-series"
              className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-400"
            >
              {BRANDING.featuredCta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}