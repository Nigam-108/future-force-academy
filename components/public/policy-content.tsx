import { PolicyVersionAccordion } from "@/components/public/policy-version-accordion";

type PolicyPageData = {
  policy: {
    id: string;
    versionNumber: number;
    title: string;
    summary?: string | null;
    contentMarkdown: string;
    publishedAt?: string | Date | null;
    type: string;
    slug: string;
    documentTitle: string;
    route: string;
    label: string;
  } | null;
  latestPolicy: {
    id: string;
    versionNumber: number;
    title: string;
    summary?: string | null;
    contentMarkdown: string;
    publishedAt?: string | Date | null;
    type: string;
    slug: string;
    documentTitle: string;
    route: string;
    label: string;
  } | null;
  previousVersions: Array<{
    id: string;
    versionNumber: number;
    title: string;
    summary?: string | null;
    contentMarkdown: string;
    publishedAt?: string | Date | null;
    type: string;
    slug: string;
    documentTitle: string;
    route: string;
    label: string;
  }>;
};

type PolicyContentProps = {
  data: PolicyPageData;
  updated?: boolean;
  updatedSummary?: string;
};

function formatDate(value?: string | Date | null) {
  if (!value) return "—";
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function simpleMarkdownToParagraphs(markdown: string) {
  return markdown
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) =>
      chunk
        .replace(/^#+\s*/gm, "")
        .replace(/^\-\s+/gm, "• ")
    );
}

export function PolicyContent({
  data,
  updated = false,
  updatedSummary,
}: PolicyContentProps) {
  if (!data.policy) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Published policy content was not found.
      </div>
    );
  }

  const paragraphs = simpleMarkdownToParagraphs(data.policy.contentMarkdown);
  const isViewingOldVersion = data.latestPolicy?.id !== data.policy.id;

  return (
    <div className="space-y-6">
      {updated ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            Updated recently
          </p>
          <p className="mt-2 text-sm text-amber-900">
            {updatedSummary ||
              "This policy has been updated recently. Please review the latest published changes carefully."}
          </p>
        </div>
      ) : null}

      <div
        id="policy-content-top"
        className={`rounded-3xl border p-6 shadow-sm sm:p-8 ${
          updated ? "border-amber-300 bg-amber-50/40" : "border-slate-200 bg-white"
        }`}
      >
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            {data.policy.label}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{data.policy.title}</h1>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
            <span>Version: {data.policy.versionNumber}</span>
            <span>Published: {formatDate(data.policy.publishedAt)}</span>
            {isViewingOldVersion ? (
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                Viewing older published version
              </span>
            ) : (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                Latest published version
              </span>
            )}
          </div>
        </div>

        {data.policy.summary ? (
          <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
            {data.policy.summary}
          </div>
        ) : null}

        <div className="space-y-4 text-[15px] leading-7 text-slate-700">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>

      <PolicyVersionAccordion
        title="Previous Published Versions"
        versions={data.previousVersions}
        activeVersionId={isViewingOldVersion ? data.policy.id : undefined}
      />
    </div>
  );
}