import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";

type EditTestPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditTestPage({
  params,
}: EditTestPageProps) {
  const { id } = await params;

  return (
    <PageShell
      title="Edit Test"
      description="This route is prepared, but real edit wiring is the next step after create-flow integration."
    >
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Edit flow comes next
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The create flow is now the active integration step. Once single-item
          read/update wiring is added, this page will load the real test by ID
          and submit updates.
        </p>
        <p className="mt-2 text-sm text-slate-500">Test ID: {id}</p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/admin/tests"
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Back to Tests
          </Link>
          <Link
            href="/admin/tests/new"
            className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Create New Test
          </Link>
        </div>
      </div>
    </PageShell>
  );
}