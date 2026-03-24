import { PageShell } from "@/components/shared/page-shell";

export default function RefundCancellationPolicyPage() {
  return (
    <PageShell
      title="Refund / Cancellation Policy"
      description="Launch-phase refund and cancellation policy for Future Force Academy."
    >
      <div className="space-y-4 text-sm leading-7 text-slate-700">
        <p>
          This page contains the default published refund and cancellation policy for Future Force
          Academy during the current launch phase.
        </p>

        <p>
          Refund eligibility, cancellation timelines, and access-related conditions may vary by
          product, batch, test series, or service type.
        </p>

        <p>
          Future Force Academy may publish newer policy versions over time. Future signups and future
          purchases may be governed by the latest applicable published version.
        </p>

        <p>
          Important account and policy-related notices may still be sent by email even when optional
          future update emails are turned off.
        </p>
      </div>
    </PageShell>
  );
}