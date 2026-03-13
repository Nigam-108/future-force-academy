import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageShell } from "@/components/shared/page-shell";

export default function GlobalLoading() {
  return (
    <PageShell title="Loading" description="Preparing your page...">
      <LoadingSkeleton />
    </PageShell>
  );
}