"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";
import { SurgeryPackage, DoctorAppointment } from "@/types/api";

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

const BOOKING_STATUS: Record<string, { badge: string; label: string }> = {
  info_pending:    { badge: "bg-amber-100 text-amber-700",    label: "Info Pending" },
  payment_pending: { badge: "bg-blue-100 text-blue-700",      label: "Payment Pending" },
  confirmed:       { badge: "bg-emerald-100 text-emerald-700", label: "Confirmed ✓" },
  completed:       { badge: "bg-teal-100 text-teal-700",      label: "Surgery Completed ✓" },
};

function RecommendationSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-5 animate-pulse space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-zinc-100 rounded w-48" />
          <div className="h-3 bg-zinc-100 rounded w-32" />
          <div className="h-3 bg-zinc-100 rounded w-20" />
        </div>
        <div className="space-y-2 items-end flex flex-col">
          <div className="h-4 bg-zinc-100 rounded w-28" />
          <div className="h-5 bg-zinc-100 rounded-full w-24" />
        </div>
      </div>
    </div>
  );
}

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
    <div className="p-8 space-y-6 max-w-3xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900">Surgery Recommendations</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Recommend surgery packages to your patients</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className={`h-9 px-4 rounded-xl text-sm font-semibold transition-colors ${
            showForm
              ? "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              : "bg-teal-600 text-white hover:bg-teal-700"
          }`}
        >
          {showForm ? "Cancel" : "+ New Recommendation"}
        </button>
      </div>

      {/* New recommendation form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-teal-200 overflow-hidden">
          <div className="px-5 py-4 bg-teal-50 border-b border-teal-100">
            <p className="font-bold text-teal-800 text-sm">Send a Surgery Recommendation</p>
            <p className="text-xs text-teal-600 mt-0.5">The patient will receive this recommendation in their portal</p>
          </div>
          <form onSubmit={submit} className="p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1.5 block">
                Select completed appointment (patient)
              </label>
              <select
                value={apptId}
                onChange={(e) => setApptId(e.target.value)}
                className="flex h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:border-teal-400 transition-colors"
              >
                <option value="">Choose appointment…</option>
                {appointments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.patient_name} — {new Date(a.scheduled_start).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1.5 block">Surgery package</label>
              <select
                value={packageId}
                onChange={(e) => setPackageId(e.target.value)}
                className="flex h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:border-teal-400 transition-colors"
              >
                <option value="">Choose package…</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.hospital_name} (${p.price_usd})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1.5 block">
                Clinical notes <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Why you're recommending this procedure…"
                className="flex w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-teal-400 transition-colors resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="h-10 px-6 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-60"
            >
              {submitting ? "Sending…" : "Send Recommendation"}
            </button>
          </form>
        </div>
      )}

      {/* Recommendations list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <RecommendationSkeleton key={i} />)}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-14 text-center">
          <p className="text-5xl mb-4">✂️</p>
          <p className="font-bold text-zinc-700 text-lg">No recommendations yet</p>
          <p className="text-zinc-400 text-sm mt-2 max-w-xs mx-auto">
            After completing a consultation, you can recommend a surgery package to your patient.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-5 h-10 px-6 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors"
          >
            Create Recommendation
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((r) => {
            const bookingStyle = r.booking_status ? BOOKING_STATUS[r.booking_status] : null;
            return (
              <div
                key={r.id}
                className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                  r.booking_id ? "border-emerald-200" : "border-zinc-200"
                }`}
              >
                {r.booking_id && (
                  <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
                )}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    {/* Package info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-lg shrink-0">
                          ✂️
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-zinc-900 text-sm">{r.package_name}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {r.hospital_name} · <span className="capitalize">{r.surgery_type.replace(/_/g, " ")}</span>
                          </p>
                        </div>
                      </div>
                      <p className="text-base font-extrabold text-teal-600 mt-2">${Number(r.price_usd).toLocaleString()} USD</p>
                    </div>

                    {/* Patient + booking status */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-semibold text-zinc-700">{r.patient_name}</p>
                        <p className="text-xs text-zinc-400">{r.patient_email}</p>
                      </div>
                      {bookingStyle && (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${bookingStyle.badge}`}>
                          {bookingStyle.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {r.notes && (
                    <div className="bg-zinc-50 rounded-xl px-3 py-2.5 border border-zinc-100">
                      <p className="text-xs text-zinc-500 leading-relaxed">{r.notes}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-zinc-50">
                    <p className="text-xs text-zinc-300">
                      {new Date(r.created_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </p>
                    {r.booking_id && (
                      <p className="text-xs text-emerald-600 font-semibold">Patient booked this surgery ✓</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
