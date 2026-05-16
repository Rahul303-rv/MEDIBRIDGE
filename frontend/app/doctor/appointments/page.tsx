"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import { DoctorAppointment } from "@/types/api";

const STATUS_STYLES: Record<string, { badge: string; dot: string; label: string }> = {
  proposed:    { badge: "bg-amber-100 text-amber-700 border border-amber-200",    dot: "bg-amber-400",   label: "Awaiting patient" },
  scheduled:   { badge: "bg-blue-100 text-blue-700 border border-blue-200",       dot: "bg-blue-400",    label: "Scheduled" },
  in_progress: { badge: "bg-purple-100 text-purple-700 border border-purple-200", dot: "bg-purple-400",  label: "In progress" },
  completed:   { badge: "bg-emerald-100 text-emerald-700 border border-emerald-200", dot: "bg-emerald-400", label: "Completed" },
  cancelled:   { badge: "bg-zinc-100 text-zinc-400 border border-zinc-200",       dot: "bg-zinc-300",    label: "Cancelled" },
  no_show:     { badge: "bg-red-100 text-red-600 border border-red-200",          dot: "bg-red-400",     label: "No show" },
};

const TRANSITIONS: Record<string, { label: string; next: string; color: string }[]> = {
  scheduled:   [
    { label: "Start Session",  next: "in_progress", color: "bg-blue-600 hover:bg-blue-700 text-white" },
    { label: "Mark No Show",   next: "no_show",      color: "border border-red-200 text-red-500 hover:bg-red-50" },
  ],
  in_progress: [
    { label: "Complete",       next: "completed",    color: "bg-emerald-600 hover:bg-emerald-700 text-white" },
  ],
};

function isInJoinWindow(scheduledStart: string): boolean {
  return Date.now() >= new Date(scheduledStart).getTime() - 15 * 60 * 1000;
}

function AppointmentSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-5 animate-pulse space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-4 bg-zinc-100 rounded w-40" />
          <div className="h-3 bg-zinc-100 rounded w-28" />
          <div className="h-3 bg-zinc-100 rounded w-44" />
        </div>
        <div className="h-6 w-24 bg-zinc-100 rounded-full" />
      </div>
      <div className="flex gap-2 pt-1">
        <div className="h-9 w-28 bg-zinc-100 rounded-xl" />
        <div className="h-9 w-24 bg-zinc-100 rounded-xl" />
      </div>
    </div>
  );
}

function AppointmentCard({
  appt, onUpdate,
}: { appt: DoctorAppointment; onUpdate: (id: number, s: string) => void }) {
  const style = STATUS_STYLES[appt.status];
  const transitions = TRANSITIONS[appt.status] ?? [];
  const showJoin = !["proposed", "completed", "cancelled", "no_show"].includes(appt.status);
  const joinReady = showJoin && isInJoinWindow(appt.scheduled_start);

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all ${
      appt.status === "in_progress" ? "border-purple-200" :
      appt.status === "proposed" ? "border-amber-200" : "border-zinc-200"
    }`}>
      {appt.status === "in_progress" && (
        <div className="h-1 bg-gradient-to-r from-purple-400 to-blue-400" />
      )}

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${style?.dot ?? "bg-zinc-300"}`} />
            <div className="min-w-0">
              <p className="font-bold text-zinc-900">{appt.patient_name}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{appt.patient_email}</p>
              <p className="text-xs text-zinc-500 mt-1">
                {new Date(appt.scheduled_start).toLocaleString("en-US", {
                  weekday: "short", month: "short", day: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${style?.badge ?? ""}`}>
            {style?.label ?? appt.status.replace("_", " ")}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {showJoin && (
            joinReady ? (
              <a
                href={appt.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 px-4 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 10l4.553-2.069A1 1 0 0121 8.82V15a1 1 0 01-.553.894L16 18M15 10L12 9m3 1v8" />
                </svg>
                Join Call
              </a>
            ) : (
              <span className="h-9 px-4 rounded-xl bg-zinc-100 text-zinc-400 text-xs font-medium flex items-center cursor-not-allowed">
                Available 15 min before
              </span>
            )
          )}
          {transitions.map((t) => (
            <button
              key={t.next}
              onClick={() => onUpdate(appt.id, t.next)}
              className={`h-9 px-4 rounded-xl text-xs font-semibold transition-colors ${t.color}`}
            >
              {t.label}
            </button>
          ))}
          {appt.status === "completed" && !appt.has_prescription && (
            <Link
              href={`/doctor/appointments/${appt.id}/prescribe`}
              className="h-9 px-4 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors"
            >
              Write Prescription
            </Link>
          )}
          {appt.status === "completed" && appt.has_prescription && (
            <Link
              href={`/doctor/appointments/${appt.id}/prescribe`}
              className="h-9 px-4 rounded-xl border border-teal-200 text-xs font-semibold text-teal-700 hover:bg-teal-50 transition-colors"
            >
              Edit Prescription →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

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

  const pending  = appointments.filter((a) => a.status === "proposed");
  const upcoming = appointments.filter((a) => ["scheduled", "in_progress"].includes(a.status));
  const past     = appointments.filter((a) => ["completed", "cancelled", "no_show"].includes(a.status));

  return (
    <div className="p-8 space-y-6 max-w-3xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-900">My Schedule</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Manage your upcoming and past consultations</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <AppointmentSkeleton key={i} />)}
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-14 text-center">
          <p className="text-5xl mb-4">📅</p>
          <p className="font-bold text-zinc-700 text-lg">No appointments yet</p>
          <p className="text-zinc-400 text-sm mt-2">
            Appointments will appear here once patients book with you. Make sure your availability is set.
          </p>
          <Link
            href="/doctor/availability"
            className="mt-5 inline-flex items-center h-10 px-6 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors"
          >
            Set Availability
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <h2 className="text-xs font-bold text-amber-600 uppercase tracking-widest">
                  Awaiting Patient Confirmation ({pending.length})
                </h2>
              </div>
              {pending.map((appt) => (
                <AppointmentCard key={appt.id} appt={appt} onUpdate={updateStatus} />
              ))}
            </section>
          )}
          {upcoming.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Upcoming</h2>
              </div>
              {upcoming.map((appt) => (
                <AppointmentCard key={appt.id} appt={appt} onUpdate={updateStatus} />
              ))}
            </section>
          )}
          {past.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-zinc-300" />
                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Past</h2>
              </div>
              {past.map((appt) => (
                <AppointmentCard key={appt.id} appt={appt} onUpdate={updateStatus} />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
