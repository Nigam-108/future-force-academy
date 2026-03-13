export const examCategories = [
  {
    slug: "wireless-psi-technical-operator",
    name: "Wireless PSI & Technical Operator",
    description: "Mock tests, practice quizzes, and structured series for Gujarat Police exams.",
    image: "/images/wpsi.jpg"
  },
  {
    slug: "upsc",
    name: "UPSC",
    description: "Objective and structured test series support for civil services preparation.",
    image: "/images/upsc.jpg"
  },
  {
    slug: "gpsc",
    name: "GPSC",
    description: "Exam-oriented practice tests and topic-based mock series.",
    image: "/images/gpsc.jpg"
  },
  {
    slug: "railway-exams",
    name: "Railway Exams",
    description: "Competitive practice tests for NTPC, Group D, and similar exams.",
    image: "/images/railway.jpg"
  }
];

export const featuredSeries = [
  {
    slug: "wpsi-full-mock-series",
    title: "WPSI Full Mock Test Series",
    exam: "Wireless PSI & Technical Operator",
    type: "Paid",
    description: "Full exam-level practice series with sectional and full-length tests."
  },
  {
    slug: "upsc-csat-practice-set",
    title: "UPSC CSAT Practice Set",
    exam: "UPSC",
    type: "Free",
    description: "Timed practice set for aptitude, reasoning, and comprehension."
  }
] as const;