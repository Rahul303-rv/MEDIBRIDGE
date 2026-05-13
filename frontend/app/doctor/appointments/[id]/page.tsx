"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import { DoctorAppointment } from "@/types/api";
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

  if (loading) return <main className="min-h-screen bg-zinc-50 p-8"><p className="text-sm text-zinc-400">Loading…</p></main>;
  if (!appt) return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <p className="text-sm text-zinc-500">Appointment not found.</p>
      <Link href="/doctor/appointments" className="text-sm text-teal-600 hover:underline mt-2 block">← Back</Link>
    </main>
  );

  const transitions = TRANSITIONS[appt.status] ?? [];
  const showJoin = !["proposed", "completed", "cancelled", "no_show"].includes(appt.status);
  const joinReady = showJoin && isInJoinWindow(appt.scheduled_start);

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Appointment Details</h1>
          <Link href="/doctor/appointments" className="text-sm text-zinc-500 hover:underline">← Back</Link>
        </div>

        <Card className="border border-zinc-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">{appt.patient_name}</CardTitle>
              <Badge className={STATUS_COLORS[appt.status] ?? ""}>{appt.status.replace("_", " ")}</Badge>
            </div>
            <p className="text-sm text-zinc-500">{appt.patient_email}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wide">Date &amp; Time</p>
                <p className="text-zinc-700 mt-0.5">
                  {new Date(appt.scheduled_start).toLocaleString("en-US", {
                    weekday: "long", month: "long", day: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wide">Duration</p>
                <p className="text-zinc-700 mt-0.5">
                  {Math.round((new Date(appt.scheduled_end).getTime() - new Date(appt.scheduled_start).getTime()) / 60000)} min
                </p>
              </div>
            </div>

            {appt.notes && (
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wide">Notes</p>
                <p className="text-sm text-zinc-700 mt-0.5">{appt.notes}</p>
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
                  className="inline-flex items-center justify-center h-10 px-5 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
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
                  className="inline-flex items-center justify-center h-8 px-3 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Recommend Surgery
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Follow-up panel */}
        {showFollowUp && appt.status === "completed" && (
          <Card className="border border-amber-200 shadow-sm bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-amber-800">Schedule Follow-up</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={proposeFollowUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-600 mb-1 block">Start</label>
                    <input type="datetime-local" value={fuStart}
                      onChange={(e) => {
                        setFuStart(e.target.value);
                        // Auto-set end to start + 30 min
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
                    <label className="text-xs text-zinc-600 mb-1 block">End</label>
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
                  <span className="text-sm text-zinc-700">Waive fee (no payment required from patient)</span>
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
