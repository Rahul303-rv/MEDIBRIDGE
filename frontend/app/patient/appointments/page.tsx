"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import { Appointment } from "@/types/api";
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

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/v1/patient/appointments")
      .then((res) => setAppointments(res.data))
      .finally(() => setLoading(false));
  }, []);

  async function cancelAppt(id: number) {
    try {
      const res = await api.post(`/api/v1/patient/appointments/${id}/cancel`);
      setAppointments((prev) => prev.map((a) => (a.id === id ? res.data : a)));
      toast.success("Appointment cancelled.");
    } catch {
      toast.error("Could not cancel.");
    }
  }

  async function confirmFollowUp(id: number) {
    try {
      const res = await api.post(`/api/v1/patient/appointments/${id}/confirm`);
      setAppointments((prev) => prev.map((a) => (a.id === id ? res.data : a)));
      toast.success("Follow-up confirmed!");
    } catch {
      toast.error("Could not confirm.");
    }
  }

  const proposed = appointments.filter((a) => a.status === "proposed");
  const upcoming = appointments.filter((a) => ["scheduled", "in_progress"].includes(a.status));
  const past = appointments.filter((a) => ["completed", "cancelled", "no_show"].includes(a.status));

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">My Appointments</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Your consultations with doctors.</p>
          </div>
          <Link href="/patient" className="text-sm text-zinc-500 hover:underline">← Dashboard</Link>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-400">Loading…</p>
        ) : appointments.length === 0 ? (
          <Card className="border border-zinc-200 shadow-sm">
            <CardContent className="pt-8 pb-8 text-center space-y-3">
              <p className="text-sm text-zinc-500">No appointments yet.</p>
              <Link href="/doctors"
                className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors">
                Find a Doctor
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {proposed.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-amber-600 uppercase tracking-wide">Awaiting Your Confirmation</h2>
                {proposed.map((appt) => (
                  <AppointmentCard key={appt.id} appt={appt} onCancel={cancelAppt} onConfirm={confirmFollowUp} />
                ))}
              </section>
            )}
            {upcoming.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Upcoming</h2>
                {upcoming.map((appt) => (
                  <AppointmentCard key={appt.id} appt={appt} onCancel={cancelAppt} onConfirm={confirmFollowUp} />
                ))}
              </section>
            )}
            {past.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Past</h2>
                {past.map((appt) => (
                  <AppointmentCard key={appt.id} appt={appt} onCancel={cancelAppt} onConfirm={confirmFollowUp} />
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
  return Date.now() >= new Date(scheduledStart).getTime() - 15 * 60 * 1000;
}

function AppointmentCard({
  appt, onCancel, onConfirm,
}: { appt: Appointment; onCancel: (id: number) => void; onConfirm: (id: number) => void }) {
  const showJoin = !["proposed", "completed", "cancelled", "no_show"].includes(appt.status);
  const joinReady = showJoin && isInJoinWindow(appt.scheduled_start);

  return (
    <Card className={`border shadow-sm ${appt.status === "proposed" ? "border-amber-200 bg-amber-50" : "border-zinc-200"}`}>
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-zinc-900">{appt.doctor_name}</p>
            <p className="text-xs text-zinc-500 mt-1">
              {new Date(appt.scheduled_start).toLocaleString("en-US", {
                weekday: "short", month: "short", day: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
            {appt.status === "proposed" && (
              <p className="text-xs text-amber-600 mt-0.5">
                {appt.parent_appointment ? "Follow-up" : "Assigned by admin"} · {appt.fee_waived ? "Fee waived" : "Payment required"}
              </p>
            )}
            {appt.payment_ref && (
              <p className="text-xs text-zinc-400">Ref: {appt.payment_ref}</p>
            )}
          </div>
          <Badge className={STATUS_COLORS[appt.status] ?? ""}>{appt.status.replace("_", " ")}</Badge>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {appt.status === "proposed" && (
            <Button size="sm"
              className="text-xs bg-amber-500 text-white hover:bg-amber-600"
              onClick={() => onConfirm(appt.id)}>
              {appt.fee_waived ? "Confirm (free)" : "Confirm & Pay"}
            </Button>
          )}
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
          {appt.status === "scheduled" && (
            <Button size="sm" variant="ghost"
              className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => onCancel(appt.id)}>
              Cancel
            </Button>
          )}
          {appt.status === "completed" && appt.has_prescription && (
            <Link href={`/patient/prescriptions`}
              className="text-xs text-teal-600 hover:underline">
              View Prescription →
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
