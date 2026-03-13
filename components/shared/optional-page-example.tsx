import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";

export default function ExampleStatePage() {
  const hasError = false;
  const isEmpty = true;

  if (hasError) {
    return <ErrorState title="Something went wrong" description="We could not load your requested page." />;
  }

  if (isEmpty) {
    return <EmptyState title="No tests found" description="Try changing filters or check back later." actionLabel="Go to Tests" />;
  }

  return <div>Optional page example for emptystate/error state</div>;
}
