import { PageShell } from "@/components/shared/page-shell";
import { AuthInsightsPanel } from "@/components/admin/auth-insights-panel";

export default function AdminAuthInsightsPage() {
  return (
    <PageShell
      title="Auth Insights"
      description="Track signup, OTP, login failures, and conversion health."
    >
      <AuthInsightsPanel />
    </PageShell>
  );
}