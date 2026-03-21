import { BookOpen, CreditCard, FileText, Home, LayoutGrid, Settings, Shield, Users } from "lucide-react";

export const publicNavItems = [
  { label: "Home", href: "/" },
  { label: "Exam Categories", href: "/exams" },
  { label: "Test Series", href: "/test-series" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" }
];

export const studentNavItems = [
  { label: "Dashboard", href: "/student/dashboard", icon: Home },
  { label: "Tests", href: "/student/tests", icon: LayoutGrid },
  { label: "Results", href: "/student/results", icon: FileText },
  { label: "Purchases", href: "/student/purchases", icon: CreditCard },
  { label: "Saved", href: "/student/saved", icon: BookOpen },
  { label: "Profile", href: "/student/profile", icon: Settings }
];

export const adminNavItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: Home },
  { label: "Questions", href: "/admin/questions", icon: FileText },
  { label: "Tests", href: "/admin/tests", icon: LayoutGrid },
  { label: "Students", href: "/admin/students", icon: Users },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Revenue", href: "/admin/revenue", icon: CreditCard },
  { label: "Permissions", href: "/admin/permissions", icon: Shield }
];