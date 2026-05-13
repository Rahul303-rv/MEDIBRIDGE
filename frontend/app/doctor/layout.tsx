import { RoleGuard } from "@/components/auth/RoleGuard";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard role="doctor">{children}</RoleGuard>;
}
