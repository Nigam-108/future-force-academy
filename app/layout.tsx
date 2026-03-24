import "./globals.css";
import type { Metadata } from "next";
import { PolicyUpdateNotice } from "@/components/auth/policy-update-notice";

export const metadata: Metadata = {
  title: {
    default: "Future Force Academy",
    template: "%s | Future Force Academy",
  },
  description: "Smart mock tests, real exam practice, and better results.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PolicyUpdateNotice />
        {children}
      </body>
    </html>
  );
}