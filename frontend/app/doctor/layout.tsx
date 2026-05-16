import { RoleGuard } from "@/components/auth/RoleGuard";
import DoctorNav from "./_components/nav";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="doctor">
      <div className="flex min-h-screen bg-zinc-50">
        <DoctorNav />
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </RoleGuard>
  );
}
