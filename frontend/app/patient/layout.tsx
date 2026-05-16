import { RoleGuard } from "@/components/auth/RoleGuard";
import PatientNav from "./_components/nav";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="patient">
      <div className="flex min-h-screen bg-zinc-50">
        <PatientNav />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </RoleGuard>
  );
}
