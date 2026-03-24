import { PolicyType } from "@prisma/client";
import { getPublicPolicyPageData } from "@/server/services/policy.service";
import { PolicyContent } from "@/components/public/policy-content";

export default async function PrivacyPolicyPage(props: {
  searchParams?: Promise<{
    version?: string;
    versionId?: string;
    updated?: string;
    summary?: string;
  }>;
}) {
  const searchParams = (await props.searchParams) ?? {};

  const data = await getPublicPolicyPageData({
    type: PolicyType.PRIVACY,
    selectedVersionId: searchParams.versionId,
    selectedVersionNumber: searchParams.version ? Number(searchParams.version) : undefined,
  });

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <PolicyContent
          data={data}
          updated={searchParams.updated === "1"}
          updatedSummary={searchParams.summary}
        />
      </div>
    </div>
  );
}