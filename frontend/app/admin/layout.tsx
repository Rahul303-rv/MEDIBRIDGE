import { RoleGuard } from "@/components/auth/RoleGuard";
import AdminSidebar from "./_components/sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="admin">
      <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <AdminSidebar />
        <div className="flex-1 overflow-auto pt-14 lg:pt-0">
          {children}
        </div>
      </div>
    </RoleGuard>
  );
}
