import { RoleGuard } from "@/components/auth/RoleGuard";
import PatientNav from "./_components/nav";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="patient">
      <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <PatientNav />
        <div className="flex-1 overflow-auto pt-14 lg:pt-0">
          {children}
        </div>
      </div>
    </RoleGuard>
  );
}
