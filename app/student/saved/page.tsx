import { PageShell } from "@/components/shared/page-shell";

export default function SavedPage() {
  return (
    <PageShell title="Saved Tests" description="Your bookmarked tests and saved test series for later.">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Saved Tests</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl border p-4">UPSC CSAT Practice Set</div>
            <div className="rounded-2xl border p-4">GPSC Aptitude Test</div>
          </div>
        </div>
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Saved Series</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl border p-4">WPSI Full Mock Test Series</div>
            <div className="rounded-2xl border p-4">Railway Group D Starter Series</div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}