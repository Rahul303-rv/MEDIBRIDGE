"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import { DoctorAppointment, PatientMedicalProfile } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

function isInJoinWindow(scheduledStart: string): boolean {
  return Date.now() >= new Date(scheduledStart).getTime() - 15 * 60 * 1000;
}

function toLocalDatetimeInput(isoString: string) {
  const d = new Date(isoString);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">{value}</p>
    </div>
  );
}

type MedEntry = {
  id?: string;
  name: string;
  dosage: string;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  night: boolean;
  meal_timing: string;
  duration_days: string;
  start_date?: string;
  instructions: string;
};

const MEAL_LABEL: Record<string, string> = {
  before_meal: "Before Meal", after_meal: "After Meal",
  with_meal: "With Meal", any: "Any Time",
};

function MedicationsDisplay({ raw }: { raw: string }) {
  let entries: MedEntry[] | null = null;
  try {
    const p = JSON.parse(raw);
    if (Array.isArray(p) && p.length > 0) entries = p;
  } catch {}

  if (!entries) {
    return <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line">{raw}</p>;
  }

  return (
    <div className="space-y-2">
      {entries.map((med, i) => {
        const timings = (["morning", "afternoon", "evening", "night"] as const)
          .filter((t) => med[t])
          .map((t) => t.charAt(0).toUpperCase() + t.slice(1));
        return (
          <div key={med.id ?? i}
            className="flex items-start gap-3 p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{med.name}</p>
                {med.dosage && <span className="text-xs text-zinc-500 dark:text-zinc-400">{med.dosage}</span>}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                {timings.length > 0 && <span className="text-xs text-zinc-500">{timings.join(" · ")}</span>}
                {med.meal_timing && <span className="text-xs text-zinc-400">{MEAL_LABEL[med.meal_timing] ?? med.meal_timing}</span>}
                {med.duration_days && <span className="text-xs text-zinc-400">{med.duration_days} days</span>}
                {med.start_date && (
                  <span className="text-xs text-zinc-400">
                    since {new Date(med.start_date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                )}
              </div>
              {med.instructions && <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 italic">{med.instructions}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PatientProfilePanel({ appointmentId, defaultOpen = false }: { appointmentId: number; defaultOpen?: boolean }) {
  const [profile, setProfile] = useState<PatientMedicalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!open || profile) return;
    api.get(`/api/v1/doctor/appointments/${appointmentId}/patient-profile`)
      .then((res) => setProfile(res.data))
      .catch(() => toast.error("Could not load patient profile."))
      .finally(() => setLoading(false));
  }, [open, appointmentId, profile]);

  function ageFromDob(dob: string | null) {
    if (!dob) return null;
    const diff = Date.now() - new Date(dob).getTime();
    return `${Math.floor(diff / (365.25 * 24 * 3600 * 1000))} yrs`;
  }

  return (
    <div className="border-t border-zinc-100 dark:border-zinc-700">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-3 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Patient Medical Profile</span>
        </div>
        <svg
          className={`w-4 h-4 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="pb-2 space-y-4">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => <div key={i} className="h-8 bg-zinc-100 dark:bg-zinc-700 rounded" />)}
            </div>
          ) : !profile ? (
            <p className="text-sm text-zinc-400">Could not load profile.</p>
          ) : (
            <>
              {/* Vital stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Age", value: ageFromDob(profile.date_of_birth) },
                  { label: "Gender", value: profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : null },
                  { label: "Blood Group", value: profile.blood_group || null },
                  { label: "Height / Weight", value: [profile.height_cm ? `${profile.height_cm} cm` : null, profile.weight_kg ? `${profile.weight_kg} kg` : null].filter(Boolean).join(" / ") || null },
                ].map(({ label, value }) => value ? (
                  <div key={label} className="bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-3 border border-zinc-100 dark:border-zinc-700">
                    <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{label}</p>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">{value}</p>
                  </div>
                ) : null)}
              </div>

              {/* DOB */}
              {profile.date_of_birth && (
                <InfoRow label="Date of Birth" value={new Date(profile.date_of_birth).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })} />
              )}

              {/* Medical history */}
              <div className="space-y-3">
                {profile.existing_conditions && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Existing Conditions</p>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line">{profile.existing_conditions}</p>
                  </div>
                )}
                {profile.allergies && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
                    <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">Allergies</p>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line">{profile.allergies}</p>
                  </div>
                )}
                {profile.current_medications && (
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Current Medications</p>
                    <MedicationsDisplay raw={profile.current_medications} />
                  </div>
                )}
                {!profile.existing_conditions && !profile.allergies && !profile.current_medications && (
                  <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">No medical history recorded.</p>
                )}
              </div>

              {/* Medical reports */}
              {profile.medical_reports.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Medical Reports</p>
                  <div className="space-y-2">
                    {profile.medical_reports.map((r) => (
                      <a
                        key={r.id}
                        href={r.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 hover:border-teal-300 dark:hover:border-teal-600 transition-colors group"
                      >
                        <svg className="w-7 h-7 text-teal-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate group-hover:text-teal-700 dark:group-hover:text-teal-400">{r.title}</p>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                            {new Date(r.uploaded_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <svg className="w-4 h-4 text-zinc-400 group-hover:text-teal-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function DoctorAppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [appt, setAppt] = useState<DoctorAppointment | null>(null);
  const [loading, setLoading] = useState(true);

  // Follow-up form state
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [fuStart, setFuStart] = useState("");
  const [fuEnd, setFuEnd] = useState("");
  const [fuFeeWaived, setFuFeeWaived] = useState(false);
  const [fuSaving, setFuSaving] = useState(false);

  useEffect(() => {
    api.get(`/api/v1/doctor/appointments`)
      .then((res) => {
        const found = (res.data as DoctorAppointment[]).find((a) => a.id === Number(id));
        setAppt(found ?? null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function updateStatus(newStatus: string) {
    if (!appt) return;
    try {
      const res = await api.patch(`/api/v1/doctor/appointments/${appt.id}/status`, { status: newStatus });
      setAppt(res.data);
      toast.success(`Status updated to ${newStatus.replace("_", " ")}.`);
    } catch {
      toast.error("Failed to update status.");
    }
  }

  async function proposeFollowUp(e: React.FormEvent) {
    e.preventDefault();
    if (!fuStart || !fuEnd) { toast.error("Please select start and end time."); return; }
    setFuSaving(true);
    try {
      await api.post(`/api/v1/doctor/appointments/${id}/follow-up`, {
        scheduled_start: new Date(fuStart).toISOString(),
        scheduled_end: new Date(fuEnd).toISOString(),
        fee_waived: fuFeeWaived,
      });
      toast.success("Follow-up proposed. Patient will be notified.");
      setShowFollowUp(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg || "Failed to propose follow-up.");
    } finally {
      setFuSaving(false);
    }
  }

  if (loading) return <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-8"><p className="text-sm text-zinc-400">Loading…</p></main>;
  if (!appt) return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-8">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Appointment not found.</p>
      <Link href="/doctor/appointments" className="text-sm text-teal-600 hover:underline mt-2 block">← Back</Link>
    </main>
  );

  const transitions = TRANSITIONS[appt.status] ?? [];
  const showJoin = !["proposed", "completed", "cancelled", "no_show"].includes(appt.status);
  const joinReady = showJoin && isInJoinWindow(appt.scheduled_start);

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-8">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Appointment Details</h1>
          <Link href="/doctor/appointments" className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline">← Back</Link>
        </div>

        {/* Appointment info card */}
        <Card className="border border-zinc-200 dark:border-zinc-700 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">{appt.patient_name}</CardTitle>
              <Badge className={STATUS_COLORS[appt.status] ?? ""}>{appt.status.replace("_", " ")}</Badge>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{appt.patient_email}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wide">Date &amp; Time</p>
                <p className="text-zinc-700 dark:text-zinc-300 mt-0.5">
                  {new Date(appt.scheduled_start).toLocaleString("en-US", {
                    weekday: "long", month: "long", day: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wide">Duration</p>
                <p className="text-zinc-700 dark:text-zinc-300 mt-0.5">
                  {Math.round((new Date(appt.scheduled_end).getTime() - new Date(appt.scheduled_start).getTime()) / 60000)} min
                </p>
              </div>
            </div>

            {appt.notes && (
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wide">Notes</p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">{appt.notes}</p>
              </div>
            )}

            {appt.meeting_link && (
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wide">Meeting Link</p>
                <p className="text-xs text-zinc-500 mt-0.5 font-mono break-all">{appt.meeting_link}</p>
              </div>
            )}

            <div className="pt-2 flex items-center gap-3 flex-wrap">
              {showJoin ? (
                joinReady ? (
                  <a href={appt.meeting_link} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-10 px-5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors">
                    Join Consultation
                  </a>
                ) : (
                  <Button disabled className="h-10 px-5 text-sm">
                    Available 15 min before call
                  </Button>
                )
              ) : null}

              {transitions.map((t) => (
                <Button key={t.next} size="sm" variant="outline"
                  className="text-xs" onClick={() => updateStatus(t.next)}>
                  {t.label}
                </Button>
              ))}

              {appt.status === "completed" && !appt.has_prescription && (
                <Link href={`/doctor/appointments/${appt.id}/prescribe`}
                  className="inline-flex items-center justify-center h-10 px-5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors">
                  Write Prescription
                </Link>
              )}
              {appt.status === "completed" && appt.has_prescription && (
                <Link href={`/doctor/appointments/${appt.id}/prescribe`}
                  className="inline-flex items-center justify-center h-10 px-5 rounded-lg border border-zinc-200 dark:border-zinc-600 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
                  Edit Prescription
                </Link>
              )}
              {appt.status === "completed" && (
                <Button size="sm" variant="outline" className="text-xs"
                  onClick={() => setShowFollowUp((v) => !v)}>
                  {showFollowUp ? "Cancel" : "Schedule Follow-up"}
                </Button>
              )}
              {appt.status === "completed" && (
                <Link
                  href={`/doctor/surgery-recommendations?appointment=${appt.id}`}
                  className="inline-flex items-center justify-center h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-600 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  Recommend Surgery
                </Link>
              )}
            </div>

            {/* Patient medical profile — collapsible, auto-open for completed appointments */}
            {/* Auto-expand for scheduled/in_progress/completed so doctor can review patient before consultation */}
            <PatientProfilePanel
              appointmentId={appt.id}
              defaultOpen={["scheduled", "in_progress", "completed"].includes(appt.status)}
            />
          </CardContent>
        </Card>

        {/* Follow-up panel */}
        {showFollowUp && appt.status === "completed" && (
          <Card className="border border-amber-200 dark:border-amber-800 shadow-sm bg-amber-50 dark:bg-amber-900/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-amber-800 dark:text-amber-400">Schedule Follow-up</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={proposeFollowUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-600 dark:text-zinc-400 mb-1 block">Start</label>
                    <input type="datetime-local" value={fuStart}
                      onChange={(e) => {
                        setFuStart(e.target.value);
                        if (e.target.value) {
                          const end = new Date(e.target.value);
                          end.setMinutes(end.getMinutes() + 30);
                          setFuEnd(toLocalDatetimeInput(end.toISOString()));
                        }
                      }}
                      className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-600 dark:text-zinc-400 mb-1 block">End</label>
                    <input type="datetime-local" value={fuEnd}
                      onChange={(e) => setFuEnd(e.target.value)}
                      className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={fuFeeWaived}
                    onChange={(e) => setFuFeeWaived(e.target.checked)}
                    className="rounded" />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Waive fee (no payment required from patient)</span>
                </label>
                <div className="flex gap-3">
                  <Button type="submit" disabled={fuSaving} size="sm"
                    className="bg-amber-500 text-white hover:bg-amber-600 text-xs">
                    {fuSaving ? "Proposing…" : "Propose Follow-up"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
