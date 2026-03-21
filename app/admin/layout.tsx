import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Fixed sidebar */}
      <AdminSidebar />

      {/* Main content — offset by sidebar width, scrolls independently */}
      <div className="xl:ml-64 flex min-h-screen flex-col">
        <AdminTopbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}