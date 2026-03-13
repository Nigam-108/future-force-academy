export type ExamCategory = {
  slug: string;
  name: string;
  description: string;
  image: string;
};

export type FeaturedSeries = {
  slug: string;
  title: string;
  exam: string;
  type: "Free" | "Paid";
  description: string;
};