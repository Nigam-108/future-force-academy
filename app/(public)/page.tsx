import { ExamCategoryGrid } from "@/components/public/exam-category-grid";
import { FeaturedTestSeries } from "@/components/public/featured-test-series";
import { HeroSection } from "@/components/public/hero-section";
import { NoticeList } from "@/components/public/notice-list";
import { TrustSection } from "@/components/public/trust-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ExamCategoryGrid />
      <FeaturedTestSeries />
      <TrustSection />
      <NoticeList />
    </>
  );
}