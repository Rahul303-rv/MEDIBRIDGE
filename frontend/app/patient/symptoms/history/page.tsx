"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import { Appointment, SymptomIntake } from "@/types/api";
import { usePolling } from "@/hooks/use-polling";

const SEVERITY_STYLES: Record<string, string> = {
  mild:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  moderate: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  severe:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_STYLES: Record<string, { badge: string; dot: string; label: string }> = {
  pending:   { badge: "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300",   dot: "bg-amber-400",  label: "Pending review" },
  matched:   { badge: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",   dot: "bg-teal-400",   label: "Doctor matched" },
  cancelled: { badge: "bg-zinc-100 text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500",   dot: "bg-zinc-300",   label: "Cancelled" },
};

function IntakeSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5 animate-pulse space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-zinc-100 dark:bg-zinc-700 rounded w-48" />
          <div className="h-3 bg-zinc-100 dark:bg-zinc-700 rounded w-64" />
        </div>
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-zinc-100 dark:bg-zinc-700 rounded-full" />
          <div className="h-5 w-16 bg-zinc-100 dark:bg-zinc-700 rounded-full" />
        </div>
      </div>
      <div className="h-3 bg-zinc-100 dark:bg-zinc-700 rounded w-full" />
      <div className="h-3 bg-zinc-100 dark:bg-zinc-700 rounded w-4/5" />
    </div>
  );
}

/**
 * For a given matched intake, pick the most relevant appointment with the matched doctor.
 * Priority: in_progress > scheduled > completed > proposed > cancelled/no_show.
 * Matches first by intake link, falls back to same doctor + patient.
 */
const STATUS_PRIORITY: Record<string, number> = {
  in_progress: 6, scheduled: 5, completed: 4, proposed: 3, no_show: 2, cancelled: 1,
};

function pickAppointmentForIntake(intake: SymptomIntake, appts: Appointment[]): Appointment | null {
  if (!intake.matched_doctor_detail) return null;
  const matchedDoctorId = intake.matched_doctor_detail.id;
  // First prefer appointments explicitly linked to this intake
  let candidates = appts.filter((a) => a.intake === intake.id);
  // Fall back to any appointment with the matched doctor
  if (candidates.length === 0) {
    candidates = appts.filter((a) => a.doctor_id === matchedDoctorId);
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => (STATUS_PRIORITY[b.status] ?? 0) - (STATUS_PRIORITY[a.status] ?? 0));
  return candidates[0];
}

export default function SymptomHistoryPage() {
  const [intakes, setIntakes] = useState<SymptomIntake[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/v1/patient/symptom-intakes"),
      api.get("/api/v1/patient/appointments"),
    ])
      .then(([iRes, aRes]) => {
        setIntakes(iRes.data);
        setAppointments(aRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  // Auto-refresh so doctor matches / status changes appear without manual reload
  usePolling(() => {
    Promise.all([
      api.get("/api/v1/patient/symptom-intakes"),
      api.get("/api/v1/patient/appointments"),
    ])
      .then(([iRes, aRes]) => {
        setIntakes(iRes.data);
        setAppointments(aRes.data);
      })
      .catch(() => {/* silent — initial load handles errors */});
  }, 10000);

  async function cancelIntake(id: number) {
    try {
      const res = await api.post(`/api/v1/patient/symptom-intakes/${id}/cancel`);
      setIntakes((prev) => prev.map((i) => (i.id === id ? res.data : i)));
      toast.success("Request cancelled.");
    } catch {
      toast.error("Could not cancel request.");
    }
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-3xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">My Consultation Requests</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Track your submitted requests and matched doctors</p>
        </div>
        <Link
          href="/patient/symptoms"
          className="inline-flex items-center justify-center h-9 px-4 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors"
        >
          + New Request
        </Link>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <IntakeSkeleton key={i} />)}
        </div>
      ) : intakes.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-14 text-center">
          <p className="text-5xl mb-4">🩺</p>
          <p className="font-bold text-zinc-700 dark:text-zinc-200 text-lg">No requests yet</p>
          <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-2">Submit your first consultation request and our team will match you to the right doctor.</p>
          <Link
            href="/patient/symptoms"
            className="mt-5 inline-flex items-center h-10 px-6 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors"
          >
            Request a Consultation
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {intakes.map((intake) => {
            const sta = STATUS_STYLES[intake.status];
            const appt = pickAppointmentForIntake(intake, appointments);
            return (
              <div key={intake.id} className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors overflow-hidden">
                <div className="p-5 space-y-4">

                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${sta?.dot ?? "bg-zinc-300"}`} />
                      <div className="min-w-0">
                        <p className="font-bold text-zinc-900 dark:text-white truncate">{intake.chief_complaint}</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                          {new Date(intake.created_at).toLocaleDateString("en-US", {
                            year: "numeric", month: "short", day: "numeric",
                          })}
                          {" · "}Duration: {intake.duration}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${SEVERITY_STYLES[intake.severity] ?? ""}`}>
                        {intake.severity}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${sta?.badge ?? ""}`}>
                        {sta?.label ?? intake.status}
                      </span>
                    </div>
                  </div>

                  {/* Symptom description */}
                  {intake.symptoms && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed line-clamp-2">{intake.symptoms}</p>
                  )}

                  {/* Matched doctor */}
                  {intake.status === "matched" && intake.matched_doctor_detail && (
                    <div className="rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 px-4 py-4 space-y-2">
                      <p className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">Your Matched Doctor</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-sm shrink-0">
                          {intake.matched_doctor_detail.first_name?.[0]}{intake.matched_doctor_detail.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-white text-sm">
                            Dr. {intake.matched_doctor_detail.first_name} {intake.matched_doctor_detail.last_name}
                          </p>
                          {intake.matched_doctor_detail.specializations.length > 0 && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                              {intake.matched_doctor_detail.specializations.map((s) => s.name).join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                      {intake.admin_notes && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 border border-teal-100 dark:border-teal-800">
                          {intake.admin_notes}
                        </p>
                      )}
                      <div className="flex items-center gap-3 pt-1 flex-wrap">
                        {/* No appointment yet → invite to book */}
                        {!appt && (
                          <>
                            <Link
                              href={`/doctors/${intake.matched_doctor_detail.slug}`}
                              className="inline-flex items-center h-8 px-4 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors"
                            >
                              Book your consultation →
                            </Link>
                            <Link
                              href={`/doctors/${intake.matched_doctor_detail.slug}`}
                              className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-teal-600 transition-colors"
                            >
                              View profile
                            </Link>
                          </>
                        )}

                        {/* Appointment booked — pending patient confirmation/payment */}
                        {appt?.status === "proposed" && (
                          <>
                            <Link
                              href="/patient/appointments"
                              className="inline-flex items-center h-8 px-4 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors"
                            >
                              Confirm &amp; Pay →
                            </Link>
                            <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                              Awaiting your confirmation
                            </span>
                          </>
                        )}

                        {/* Scheduled — show join/join window */}
                        {appt?.status === "scheduled" && (
                          <>
                            <Link
                              href="/patient/appointments"
                              className="inline-flex items-center h-8 px-4 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
                            >
                              View appointment →
                            </Link>
                            <span className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                              Scheduled for {new Date(appt.scheduled_start).toLocaleString("en-US", {
                                weekday: "short", month: "short", day: "numeric",
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </span>
                          </>
                        )}

                        {/* Consultation in progress */}
                        {appt?.status === "in_progress" && (
                          <>
                            <a
                              href={appt.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center h-8 px-4 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors"
                            >
                              Join call →
                            </a>
                            <span className="text-xs text-purple-700 dark:text-purple-400 font-medium">
                              Consultation in progress
                            </span>
                          </>
                        )}

                        {/* Completed — show prescription if any, else completion notice */}
                        {appt?.status === "completed" && (
                          <>
                            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                              Consultation completed
                            </span>
                            {appt.has_prescription ? (
                              <Link
                                href="/patient/prescriptions"
                                className="inline-flex items-center h-8 px-4 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors"
                              >
                                View prescription →
                              </Link>
                            ) : (
                              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                                Awaiting prescription from doctor
                              </span>
                            )}
                          </>
                        )}

                        {/* Cancelled / no-show — allow re-booking */}
                        {(appt?.status === "cancelled" || appt?.status === "no_show") && (
                          <>
                            <Link
                              href={`/doctors/${intake.matched_doctor_detail.slug}`}
                              className="inline-flex items-center h-8 px-4 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors"
                            >
                              Re-book consultation →
                            </Link>
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">
                              Previous appointment was {appt.status === "no_show" ? "marked as no-show" : "cancelled"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pending cancel action */}
                  {intake.status === "pending" && (
                    <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">Our team will review and match you shortly</p>
                      <button
                        onClick={() => cancelIntake(intake.id)}
                        className="h-8 px-3 rounded-xl border border-red-200 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                      >
                        Cancel request
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
