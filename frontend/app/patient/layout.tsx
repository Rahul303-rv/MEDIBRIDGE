import { RoleGuard } from "@/components/auth/RoleGuard";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard role="patient">{children}</RoleGuard>;
}
