"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@/types/api";

type Role = User["role"];

interface RoleGuardProps {
  role: Role;
  children: React.ReactNode;
}

export function RoleGuard({ role, children }: RoleGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      const next = encodeURIComponent(window.location.pathname);
      router.replace(`/auth/login?next=${next}`);
      return;
    }

    if (user.role !== role) {
      router.replace(`/${user.role}`);
    }
  }, [user, loading, role, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-sm text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== role) {
    return null;
  }

  return <>{children}</>;
}
