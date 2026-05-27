"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import { Appointment } from "@/types/api";

const STATUS_STYLES: Record<string, { badge: string; dot: string; label: string }> = {
  proposed:    { badge: "bg-amber-100 text-amber-700 border border-amber-200",   dot: "bg-amber-400",  label: "Awaiting confirmation" },
  scheduled:   { badge: "bg-blue-100 text-blue-700 border border-blue-200",      dot: "bg-blue-400",   label: "Scheduled" },
  in_progress: { badge: "bg-purple-100 text-purple-700 border border-purple-200", dot: "bg-purple-400", label: "In progress" },
  completed:   { badge: "bg-emerald-100 text-emerald-700 border border-emerald-200", dot: "bg-emerald-400", label: "Completed" },
  cancelled:   { badge: "bg-zinc-100 text-zinc-400 border border-zinc-200",      dot: "bg-zinc-300",   label: "Cancelled" },
  no_show:     { badge: "bg-red-100 text-red-600 border border-red-200",         dot: "bg-red-400",    label: "No show" },
};

function isInJoinWindow(scheduledStart: string): boolean {
  return Date.now() >= new Date(scheduledStart).getTime() - 15 * 60 * 1000;
}

function AppointmentSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5 animate-pulse space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-4 bg-zinc-100 dark:bg-zinc-700 rounded w-36" />
          <div className="h-3 bg-zinc-100 dark:bg-zinc-700 rounded w-48" />
        </div>
        <div className="h-6 w-24 bg-zinc-100 dark:bg-zinc-700 rounded-full" />
      </div>
      <div className="flex gap-2 flex-wrap">
        <div className="h-8 w-20 bg-zinc-100 dark:bg-zinc-700 rounded-xl" />
      </div>
    </div>
  );
}

function AppointmentCard({
  appt, onCancel, onConfirm,
}: { appt: Appointment; onCancel: (id: number) => void; onConfirm: (id: number) => void }) {
  const style = STATUS_STYLES[appt.status];
  const showJoin = !["proposed", "completed", "cancelled", "no_show"].includes(appt.status);
  const joinReady = showJoin && isInJoinWindow(appt.scheduled_start);

  return (
    <div className={`bg-white dark:bg-zinc-800 rounded-2xl border overflow-hidden transition-all ${
      appt.status === "proposed" ? "border-amber-200" : "border-zinc-200 dark:border-zinc-700"
    }`}>
      {/* Top accent for proposed */}
      {appt.status === "proposed" && (
        <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
      )}

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${style?.dot ?? "bg-zinc-300"}`} />
            <div>
              <p className="font-bold text-zinc-900 dark:text-white">{appt.doctor_name}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {new Date(appt.scheduled_start).toLocaleString("en-US", {
                  weekday: "short", month: "short", day: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
              {appt.status === "proposed" && (
                <p className="text-xs text-amber-600 mt-1 font-medium">
                  {appt.parent_appointment ? "Follow-up appointment" : "Assigned by MediBridge team"}
                  {" · "}
                  {appt.fee_waived ? "Fee waived ✓" : "Payment required"}
                </p>
              )}
            </div>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${style?.badge ?? ""}`}>
            {style?.label ?? appt.status.replace("_", " ")}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {appt.status === "proposed" && (
            <button
              onClick={() => onConfirm(appt.id)}
              className="h-9 px-4 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors"
            >
              {appt.fee_waived ? "Confirm (free)" : "Confirm & Pay"}
            </button>
          )}
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
                Join Now
              </a>
            ) : (
              <span className="h-9 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 text-xs font-medium flex items-center cursor-not-allowed">
                Available 15 min before
              </span>
            )
          )}
          {appt.status === "scheduled" && (
            <button
              onClick={() => onCancel(appt.id)}
              className="h-9 px-4 rounded-xl border border-red-200 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
            >
              Cancel
            </button>
          )}
          {appt.status === "completed" && appt.has_prescription && (
            <Link
              href="/patient/prescriptions"
              className="h-9 px-4 rounded-xl border border-teal-200 text-xs font-semibold text-teal-700 hover:bg-teal-50 transition-colors"
            >
              View Prescription →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

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
  const past     = appointments.filter((a) => ["completed", "cancelled", "no_show"].includes(a.status));

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-3xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">My Appointments</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Your consultations with doctors</p>
        </div>
        <Link
          href="/patient/symptoms"
          className="h-9 px-4 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors"
        >
          + New Consultation
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <AppointmentSkeleton key={i} />)}
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-14 text-center">
          <p className="text-5xl mb-4">📅</p>
          <p className="font-bold text-zinc-700 dark:text-zinc-200 text-lg">No appointments yet</p>
          <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-2">
            Submit a consultation request and get matched to a doctor.
          </p>
          <Link
            href="/patient/symptoms"
            className="mt-5 inline-flex items-center h-10 px-6 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors"
          >
            Request a Consultation
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {proposed.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <h2 className="text-xs font-bold text-amber-600 uppercase tracking-widest">
                  Awaiting Your Confirmation ({proposed.length})
                </h2>
              </div>
              {proposed.map((appt) => (
                <AppointmentCard key={appt.id} appt={appt} onCancel={cancelAppt} onConfirm={confirmFollowUp} />
              ))}
            </section>
          )}
          {upcoming.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Upcoming</h2>
              </div>
              {upcoming.map((appt) => (
                <AppointmentCard key={appt.id} appt={appt} onCancel={cancelAppt} onConfirm={confirmFollowUp} />
              ))}
            </section>
          )}
          {past.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-zinc-300" />
                <h2 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Past</h2>
              </div>
              {past.map((appt) => (
                <AppointmentCard key={appt.id} appt={appt} onCancel={cancelAppt} onConfirm={confirmFollowUp} />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
