"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";

interface PrescriptionSummary {
  id: number;
  appointment_id: number;
  appointment_date: string;
  doctor_name: string;
  diagnosis: string;
  created_at: string;
}

export default function PatientPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/v1/patient/prescriptions")
      .then((res) => setPrescriptions(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">My Prescriptions</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Prescriptions from your consultations.</p>
          </div>
          <Link href="/patient" className="text-sm text-zinc-500 hover:underline">← Dashboard</Link>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-400">Loading…</p>
        ) : prescriptions.length === 0 ? (
          <Card className="border border-zinc-200 shadow-sm">
            <CardContent className="pt-8 pb-8 text-center">
              <p className="text-sm text-zinc-500">No prescriptions yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {prescriptions.map((rx) => (
              <Link key={rx.id} href={`/patient/prescriptions/${rx.id}`}>
                <Card className="border border-zinc-200 shadow-sm hover:border-teal-300 transition-colors cursor-pointer">
                  <CardContent className="pt-5 space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-zinc-900">{rx.doctor_name}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {new Date(rx.appointment_date).toLocaleString("en-US", {
                            weekday: "short", month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                        <p className="text-sm text-zinc-600 mt-1 line-clamp-2">{rx.diagnosis}</p>
                      </div>
                      <span className="text-xs text-teal-600 whitespace-nowrap mt-1">View →</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
