import { AttemptPageClient } from "@/components/student/attempt-page-client";

type PageProps = {
  params: Promise<{
    testId: string;
  }>;
};

export default async function TestAttemptPage({ params }: PageProps) {
  const { testId } = await params;

  return <AttemptPageClient testId={testId} />;
}