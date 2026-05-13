"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import { DoctorProfile } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

interface AdminDoctorProfile extends DoctorProfile {
  email: string;
}

export default function AdminDoctorsPage() {
  const { logout } = useAuth();
  const [doctors, setDoctors] = useState<AdminDoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<number | null>(null);

  useEffect(() => {
    api.get("/api/v1/admin/doctors")
      .then((res) => setDoctors(res.data))
      .catch(() => toast.error("Failed to load doctors."))
      .finally(() => setLoading(false));
  }, []);

  async function verifyDoctor(id: number) {
    setVerifying(id);
    try {
      await api.post(`/api/v1/admin/doctors/${id}/verify`);
      setDoctors((prev) =>
        prev.map((d) => (d.id === id ? { ...d, is_verified: true } : d))
      );
      toast.success("Doctor verified.");
    } catch {
      toast.error("Failed to verify doctor.");
    } finally {
      setVerifying(null);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Doctors</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Manage doctor accounts and verification.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/doctors/invite"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
              Invite doctor
            </Link>
            <Button variant="outline" onClick={logout}>Logout</Button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-400">Loading…</p>
        ) : doctors.length === 0 ? (
          <Card className="border border-zinc-200 shadow-sm">
            <CardContent className="pt-6 text-center text-zinc-500 text-sm">
              No doctors yet.{" "}
              <Link href="/admin/doctors/invite" className="text-teal-600 hover:underline">Invite one</Link>.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {doctors.map((doctor) => (
              <Card key={doctor.id} className="border border-zinc-200 shadow-sm">
                <CardContent className="pt-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-zinc-900 truncate">
                        {doctor.first_name || doctor.last_name
                          ? `${doctor.first_name} ${doctor.last_name}`.trim()
                          : "(Name not set)"}
                      </p>
                      <Badge
                        className={
                          doctor.is_verified
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shrink-0"
                            : "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 shrink-0"
                        }
                      >
                        {doctor.is_verified ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-500 truncate">{doctor.email}</p>
                    {doctor.specializations.length > 0 && (
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {doctor.specializations.map((s) => s.name).join(", ")}
                      </p>
                    )}
                  </div>
                  {!doctor.is_verified && (
                    <Button
                      size="sm"
                      onClick={() => verifyDoctor(doctor.id)}
                      disabled={verifying === doctor.id}
                      className="shrink-0"
                    >
                      {verifying === doctor.id ? "Verifying…" : "Verify"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
