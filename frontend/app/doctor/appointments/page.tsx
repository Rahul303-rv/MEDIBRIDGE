"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import { DoctorAppointment } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_COLORS: Record<string, string> = {
  proposed:    "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
  scheduled:   "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-100",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
  completed:   "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  cancelled:   "bg-zinc-100 text-zinc-400 border-zinc-200 hover:bg-zinc-100",
  no_show:     "bg-red-100 text-red-600 border-red-200 hover:bg-red-100",
};

const TRANSITIONS: Record<string, { label: string; next: string }[]> = {
  scheduled:   [{ label: "Start", next: "in_progress" }, { label: "No Show", next: "no_show" }],
  in_progress: [{ label: "Complete", next: "completed" }],
};

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/v1/doctor/appointments")
      .then((res) => setAppointments(res.data))
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: number, newStatus: string) {
    try {
      const res = await api.patch(`/api/v1/doctor/appointments/${id}/status`, { status: newStatus });
      setAppointments((prev) => prev.map((a) => (a.id === id ? res.data : a)));
      toast.success(`Status updated to ${newStatus.replace("_", " ")}.`);
    } catch {
      toast.error("Failed to update status.");
    }
  }

  const pending = appointments.filter((a) => a.status === "proposed");
  const upcoming = appointments.filter((a) => ["scheduled", "in_progress"].includes(a.status));
  const past = appointments.filter((a) => ["completed", "cancelled", "no_show"].includes(a.status));

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">My Schedule</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Manage your upcoming consultations.</p>
          </div>
          <Link href="/doctor" className="text-sm text-zinc-500 hover:underline">← Dashboard</Link>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-400">Loading…</p>
        ) : appointments.length === 0 ? (
          <p className="text-sm text-zinc-500">No appointments yet.</p>
        ) : (
          <>
            {pending.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-amber-600 uppercase tracking-wide">Awaiting Patient Confirmation</h2>
                {pending.map((appt) => (
                  <AppointmentCard key={appt.id} appt={appt} onUpdate={updateStatus} />
                ))}
              </section>
            )}
            {upcoming.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Upcoming</h2>
                {upcoming.map((appt) => (
                  <AppointmentCard key={appt.id} appt={appt} onUpdate={updateStatus} />
                ))}
              </section>
            )}
            {past.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Past</h2>
                {past.map((appt) => (
                  <AppointmentCard key={appt.id} appt={appt} onUpdate={updateStatus} />
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function isInJoinWindow(scheduledStart: string): boolean {
  const start = new Date(scheduledStart).getTime();
  const now = Date.now();
  return now >= start - 15 * 60 * 1000;
}

function AppointmentCard({
  appt, onUpdate,
}: { appt: DoctorAppointment; onUpdate: (id: number, s: string) => void }) {
  const transitions = TRANSITIONS[appt.status] ?? [];
  const showJoin = !["proposed", "completed", "cancelled", "no_show"].includes(appt.status);
  const joinReady = showJoin && isInJoinWindow(appt.scheduled_start);

  return (
    <Card className="border border-zinc-200 shadow-sm">
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-zinc-900">{appt.patient_name}</p>
            <p className="text-xs text-zinc-500">{appt.patient_email}</p>
            <p className="text-xs text-zinc-500 mt-1">
              {new Date(appt.scheduled_start).toLocaleString("en-US", {
                weekday: "short", month: "short", day: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
          <Badge className={STATUS_COLORS[appt.status] ?? ""}>{appt.status.replace("_", " ")}</Badge>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {showJoin && (
            joinReady ? (
              <a href={appt.meeting_link} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-teal-600 text-white text-xs font-medium hover:bg-teal-700 transition-colors">
                Join
              </a>
            ) : (
              <span className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-zinc-100 text-zinc-400 text-xs font-medium cursor-not-allowed">
                Available 15 min before call
              </span>
            )
          )}
          {transitions.map((t) => (
            <Button key={t.next} size="sm" variant="outline"
              className="text-xs" onClick={() => onUpdate(appt.id, t.next)}>
              {t.label}
            </Button>
          ))}
          {appt.status === "completed" && !appt.has_prescription && (
            <Link href={`/doctor/appointments/${appt.id}/prescribe`}
              className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-teal-600 text-white text-xs font-medium hover:bg-teal-700 transition-colors">
              Write Prescription
            </Link>
          )}
          {appt.status === "completed" && appt.has_prescription && (
            <Link href={`/doctor/appointments/${appt.id}/prescribe`}
              className="text-xs text-teal-600 hover:underline">
              Edit Prescription →
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
