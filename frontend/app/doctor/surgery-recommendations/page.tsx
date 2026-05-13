"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import { SurgeryPackage, DoctorAppointment } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SurgeryRecommendation {
  id: number;
  package_name: string;
  package_slug: string;
  hospital_name: string;
  surgery_type: string;
  price_usd: string;
  patient_name: string;
  patient_email: string;
  notes: string;
  appointment: number | null;
  created_at: string;
  booking_id: number | null;
  booking_status: string | null;
}

const BOOKING_STATUS_COLORS: Record<string, string> = {
  info_pending:    "bg-amber-100 text-amber-700",
  payment_pending: "bg-blue-100 text-blue-700",
  confirmed:       "bg-emerald-100 text-emerald-700",
  completed:       "bg-teal-100 text-teal-700",
};
const BOOKING_STATUS_LABEL: Record<string, string> = {
  info_pending: "Booking: Info Pending",
  payment_pending: "Booking: Payment Pending",
  confirmed: "Booking Confirmed ✓",
  completed: "Surgery Completed ✓",
};

export default function DoctorSurgeryRecommendationsPage() {
  const searchParams = useSearchParams();
  const [recommendations, setRecommendations] = useState<SurgeryRecommendation[]>([]);
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [packages, setPackages] = useState<SurgeryPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [apptId, setApptId] = useState(searchParams.get("appointment") ?? "");
  const [packageId, setPackageId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (searchParams.get("appointment")) setShowForm(true);
  }, [searchParams]);

  useEffect(() => {
    Promise.all([
      api.get("/api/v1/doctor/surgery-recommendations"),
      api.get("/api/v1/doctor/appointments"),
      api.get("/api/v1/public/packages"),
    ]).then(([recRes, apptRes, pkgRes]) => {
      setRecommendations(recRes.data);
      setAppointments((apptRes.data as DoctorAppointment[]).filter((a) => a.status === "completed"));
      setPackages(pkgRes.data);
    }).catch(() => toast.error("Failed to load data."))
      .finally(() => setLoading(false));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!apptId || !packageId) { toast.error("Please select appointment and package."); return; }
    setSubmitting(true);
    try {
      const res = await api.post("/api/v1/doctor/surgery-recommendations", {
        appointment_id: Number(apptId),
        package_id: Number(packageId),
        notes,
      });
      setRecommendations((prev) => [res.data, ...prev]);
      setShowForm(false);
      setApptId(""); setPackageId(""); setNotes("");
      toast.success("Recommendation sent to patient.");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      toast.error(msg || "Failed to send recommendation.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Surgery Recommendations</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Recommend surgery packages to your patients.</p>
          </div>
          <Link href="/doctor" className="text-sm text-zinc-500 hover:underline">← Dashboard</Link>
        </div>

        <Button onClick={() => setShowForm((v) => !v)} className="bg-teal-600 hover:bg-teal-700 text-white">
          {showForm ? "Cancel" : "New Recommendation"}
        </Button>

        {showForm && (
          <Card className="border border-teal-200 shadow-sm bg-teal-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-teal-800">Send a Surgery Recommendation</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-600 mb-1 block">Select completed appointment (patient)</label>
                  <select value={apptId} onChange={(e) => setApptId(e.target.value)}
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring">
                    <option value="">Choose appointment…</option>
                    {appointments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.patient_name} — {new Date(a.scheduled_start).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-600 mb-1 block">Surgery package</label>
                  <select value={packageId} onChange={(e) => setPackageId(e.target.value)}
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring">
                    <option value="">Choose package…</option>
                    {packages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.hospital_name} (${p.price_usd})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-600 mb-1 block">Clinical notes (optional)</label>
                  <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
                    placeholder="Why you're recommending this procedure…"
                    className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring resize-none" />
                </div>
                <Button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-700 text-white text-sm">
                  {submitting ? "Sending…" : "Send Recommendation"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="text-sm text-zinc-400">Loading…</p>
        ) : recommendations.length === 0 ? (
          <p className="text-sm text-zinc-500">No recommendations sent yet.</p>
        ) : (
          <div className="space-y-3">
            {recommendations.map((r) => (
              <Card key={r.id} className={`shadow-sm ${r.booking_id ? "border border-emerald-200 bg-emerald-50" : "border border-zinc-200"}`}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-zinc-900 text-sm">{r.package_name}</p>
                      <p className="text-xs text-zinc-500">{r.hospital_name} · {r.surgery_type}</p>
                      <p className="text-xs font-medium text-teal-700 mt-0.5">${r.price_usd}</p>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="text-xs font-medium text-zinc-700">{r.patient_name}</p>
                      <p className="text-xs text-zinc-400">{r.patient_email}</p>
                      {r.booking_id && r.booking_status && (
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${BOOKING_STATUS_COLORS[r.booking_status] ?? "bg-zinc-100 text-zinc-500"}`}>
                          {BOOKING_STATUS_LABEL[r.booking_status] ?? r.booking_status}
                        </span>
                      )}
                    </div>
                  </div>
                  {r.notes && <p className="text-xs text-zinc-500 pt-1 border-t border-zinc-100">{r.notes}</p>}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-zinc-300">{new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    {r.booking_id && (
                      <span className="text-xs text-emerald-600 font-medium">Patient has booked this surgery</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
