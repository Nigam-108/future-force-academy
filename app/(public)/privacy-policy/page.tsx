import { PageShell } from "@/components/shared/page-shell";

export default function PrivacyPolicyPage() {
  return (
    <PageShell title="Privacy Policy" description="Basic placeholder privacy policy for first launch.">
      <div className="rounded-3xl border bg-white p-8 shadow-sm">
        <div className="prose max-w-none prose-slate">
          <p>
            Future Force Academy collects limited information required for account creation,
            test access, purchases, and communication related to the platform.
          </p>
          <p>
            User data such as name, email, mobile number, selected course, purchases,
            and test activity may be stored for service delivery and account management.
          </p>
          <p>
            This placeholder text should be replaced with the final legal policy before full public production use.
          </p>
        </div>
      </div>
    </PageShell>
  );
}