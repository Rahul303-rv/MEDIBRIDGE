"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Appointment } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_COLORS: Record<string, string> = {
  scheduled:   "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-100",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
  completed:   "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  cancelled:   "bg-zinc-100 text-zinc-400 border-zinc-200 hover:bg-zinc-100",
  no_show:     "bg-red-100 text-red-600 border-red-200 hover:bg-red-100",
};

function isInJoinWindow(scheduledStart: string): boolean {
  return Date.now() >= new Date(scheduledStart).getTime() - 15 * 60 * 1000;
}

export default function PatientAppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/v1/patient/appointments`)
      .then((res) => {
        const found = (res.data as Appointment[]).find((a) => a.id === Number(id));
        setAppt(found ?? null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <main className="min-h-screen bg-zinc-50 p-8"><p className="text-sm text-zinc-400">Loading…</p></main>;
  if (!appt) return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <p className="text-sm text-zinc-500">Appointment not found.</p>
      <Link href="/patient/appointments" className="text-sm text-teal-600 hover:underline mt-2 block">← Back</Link>
    </main>
  );

  const showJoin = !["completed", "cancelled", "no_show"].includes(appt.status);
  const joinReady = showJoin && isInJoinWindow(appt.scheduled_start);

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Appointment Details</h1>
          <Link href="/patient/appointments" className="text-sm text-zinc-500 hover:underline">← Back</Link>
        </div>

        <Card className="border border-zinc-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">{appt.doctor_name}</CardTitle>
              <Badge className={STATUS_COLORS[appt.status] ?? ""}>{appt.status.replace("_", " ")}</Badge>
            </div>
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
              {appt.doctor_fee && (
                <div>
                  <p className="text-xs text-zinc-400 uppercase tracking-wide">Fee</p>
                  <p className="text-zinc-700 mt-0.5">${appt.doctor_fee}</p>
                </div>
              )}
              {appt.payment_ref && (
                <div>
                  <p className="text-xs text-zinc-400 uppercase tracking-wide">Payment Ref</p>
                  <p className="text-zinc-700 mt-0.5 font-mono text-xs">{appt.payment_ref}</p>
                </div>
              )}
            </div>

            {appt.notes && (
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wide">Notes</p>
                <p className="text-sm text-zinc-700 mt-0.5">{appt.notes}</p>
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

              {appt.status === "completed" && appt.has_prescription && (
                <Link href={`/patient/appointments/${appt.id}/prescription`}
                  className="inline-flex items-center justify-center h-10 px-5 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
                  View Prescription
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
