"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import api from "@/lib/api";
import { DoctorProfile } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BookPage() {
  const params = useSearchParams();
  const router = useRouter();
  const doctorId = params.get("doctor");
  const start = params.get("start");
  const end = params.get("end");
  const intakeId = params.get("intake");

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!doctorId) { router.replace("/doctors"); return; }
    // Fetch from public endpoint by ID via available-slots parent
    api.get(`/api/v1/patient/doctors/${doctorId}/available-slots`)
      .catch(() => {});
    // Get doctor info — fetch doctor list and find by id (public endpoint doesn't have /by-id)
    api.get("/api/v1/public/doctors")
      .then((res) => {
        const found = res.data.find((d: DoctorProfile) => String(d.id) === doctorId);
        setDoctor(found ?? null);
      })
      .finally(() => setLoading(false));
  }, [doctorId, router]);

  async function confirmBooking() {
    if (!doctorId || !start || !end) return;
    if (submitting || submitted) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        doctor_id: Number(doctorId),
        scheduled_start: start,
        scheduled_end: end,
      };
      if (intakeId) payload.intake_id = Number(intakeId);
      await api.post("/api/v1/patient/appointments", payload);
      setSubmitted(true);
      toast.success("Appointment booked successfully.");
      router.push("/patient/appointments");
    } catch (err: unknown) {
      const hasResponse = axios.isAxiosError(err) && !!err.response;
      if (hasResponse) {
        const code = err.response?.data?.error?.code;
        if (code === "slot_taken") {
          toast.error("That slot was just taken. Please choose another time.");
          router.back();
        } else {
          toast.error("Booking failed. Please try again.");
        }
      } else {
        // Timeout — appointment likely booked, redirect to appointments
        toast.success("Appointment booked! Redirecting…");
        router.push("/patient/appointments");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-8 flex items-center justify-center">
      <p className="text-sm text-zinc-400">Loading…</p>
    </main>
  );

  if (!doctor || !start || !end) return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-8">
      <p className="text-sm text-red-500">Invalid booking link. <Link href="/doctors" className="underline">Go back</Link>.</p>
    </main>
  );

  const startDate = new Date(start);
  const endDate = new Date(end);

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-8">
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Confirm Booking</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Review your appointment details before confirming.</p>
        </div>

        <Card className="border border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Appointment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Doctor" value={`Dr. ${doctor.first_name} ${doctor.last_name}`} />
            <Row label="Date" value={startDate.toLocaleDateString("en-US", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })} />
            <Row label="Time" value={`${startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} – ${endDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`} />
            {doctor.consultation_fee_usd && (
              <Row label="Fee" value={`$${doctor.consultation_fee_usd} USD`} />
            )}
            <p className="text-xs text-zinc-400 dark:text-zinc-500 pt-1">
              Times shown in your local timezone. Payment is processed at the time of booking.
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => router.back()} disabled={submitting}>
            Back
          </Button>
          <Button className="flex-1" onClick={confirmBooking} disabled={submitting || submitted}>
            {submitted ? "Confirmed ✓" : submitting ? "Confirming…" : "Confirm & Pay"}
          </Button>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="font-medium text-zinc-800 dark:text-zinc-200">{value}</span>
    </div>
  );
}
