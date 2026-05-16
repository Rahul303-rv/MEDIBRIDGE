import { RoleGuard } from "@/components/auth/RoleGuard";
import AdminSidebar from "./_components/sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="admin">
      <div className="flex min-h-screen bg-zinc-50">
        <AdminSidebar />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </RoleGuard>
  );
}
