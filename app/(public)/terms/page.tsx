import { PageShell } from "@/components/shared/page-shell";

export default function TermsPage() {
  return (
    <PageShell title="Terms & Conditions" description="Basic placeholder terms page for first launch.">
      <div className="rounded-3xl border bg-white p-8 shadow-sm">
        <div className="prose max-w-none prose-slate">
          <p>
            By using the Future Force Academy platform, users agree to comply with platform rules,
            account security practices, purchase terms, and test conduct guidelines.
          </p>
          <p>
            Paid access, account sharing rules, test availability,
            and administrative decisions regarding access control are subject to final platform policies.
          </p>
          <p>
            This placeholder content should be replaced with final legal content before production launch.
          </p>
        </div>
      </div>
    </PageShell>
  );
}