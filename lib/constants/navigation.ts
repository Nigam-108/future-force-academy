import {
  Activity,
  BarChart2,
  BookOpen,
  CreditCard,
  FileText,
  Home,
  Layers,
  LayoutGrid,
  Megaphone,
  Settings,
  Shield,
  Tag,
  Users,
  FolderOpen,
} from "lucide-react";

export const publicNavItems = [
  { label: "Home", href: "/" },
  { label: "Exam Categories", href: "/exams" },
  { label: "Test Series", href: "/test-series" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const studentNavItems = [
  { label: "Dashboard", href: "/student/dashboard", icon: Home },
  { label: "Tests", href: "/student/tests", icon: LayoutGrid },
  { label: "Results", href: "/student/results", icon: FileText },
  { label: "Purchases", href: "/student/purchases", icon: CreditCard },
  { label: "Saved", href: "/student/saved", icon: BookOpen },
  { label: "Profile", href: "/student/profile", icon: Settings },
];

// ─── Admin navigation — grouped by domain ────────────────────────────────────

export type AdminNavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

export type AdminNavGroup = {
  groupLabel: string;
  items: AdminNavItem[];
};

export const adminNavGroups: AdminNavGroup[] = [
  {
    groupLabel: "Overview",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: Home },
    ],
  },
  {
    groupLabel: "Content",
    items: [
      { label: "Questions", href: "/admin/questions", icon: FileText },
      { label: "Tests", href: "/admin/tests", icon: LayoutGrid },
      { label: "Batches", href: "/admin/batches", icon: Layers },
      { label: "Categories", href: "/admin/categories", icon: FolderOpen },
    ],
  },
  {
    groupLabel: "Students",
    items: [
      { label: "Students", href: "/admin/students", icon: Users },
      { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
    ],
  },
  {
    groupLabel: "Finance",
    items: [
      { label: "Payments", href: "/admin/payments", icon: CreditCard },
      { label: "Revenue", href: "/admin/revenue", icon: BarChart2 },
      { label: "Coupons", href: "/admin/coupons", icon: Tag },
    ],
  },
  {
    groupLabel: "System",
    items: [
      { label: "Reports", href: "/admin/reports", icon: BarChart2 },
      { label: "Activity Logs", href: "/admin/activity-logs", icon: Activity },
      { label: "Permissions", href: "/admin/permissions", icon: Shield },
    ],
  },
];

// Flat list kept for any places that still need it
export const adminNavItems = adminNavGroups.flatMap((g) => g.items);