"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface SurgeryRecommendation {
  id: number;
  package: number;
  package_name: string;
  package_slug: string;
  hospital_name: string;
  surgery_type: string;
  price_usd: string;
  doctor_name: string;
  notes: string;
  created_at: string;
  booking_id: number | null;
  booking_status: string | null;
}

const BOOKING_STATUS_COLORS: Record<string, string> = {
  info_pending:    "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
  payment_pending: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
  confirmed:       "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  completed:       "bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-100",
  cancelled:       "bg-zinc-100 text-zinc-400 border-zinc-200 hover:bg-zinc-100",
};

const BOOKING_STATUS_LABEL: Record<string, string> = {
  info_pending: "Info Pending",
  payment_pending: "Payment Pending",
  confirmed: "Booking Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function PatientSurgeryRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<SurgeryRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/v1/patient/surgery-recommendations")
      .then((res) => setRecommendations(res.data))
      .catch(() => toast.error("Failed to load recommendations."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Surgery Recommendations</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Surgery packages your doctor has recommended.</p>
          </div>
          <Link href="/patient" className="text-sm text-zinc-500 hover:underline">← Dashboard</Link>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-400">Loading…</p>
        ) : recommendations.length === 0 ? (
          <Card className="border border-zinc-200 shadow-sm">
            <CardContent className="pt-8 pb-8 text-center text-sm text-zinc-500">
              No recommendations yet. Your doctor will send surgery recommendations after your consultation.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {recommendations.map((r) => {
              const isBooked = !!r.booking_id;
              return (
                <Card key={r.id} className={`shadow-sm ${isBooked ? "border border-emerald-200 bg-emerald-50" : "border border-teal-200 bg-teal-50"}`}>
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-zinc-900">{r.package_name}</p>
                        <p className="text-sm text-zinc-600">{r.hospital_name}</p>
                        <p className="text-xs text-zinc-500">{r.surgery_type}</p>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <p className="text-lg font-bold text-teal-700">${r.price_usd}</p>
                        {isBooked && r.booking_status && (
                          <Badge className={BOOKING_STATUS_COLORS[r.booking_status] ?? ""}>
                            {BOOKING_STATUS_LABEL[r.booking_status] ?? r.booking_status}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg bg-white border border-teal-100 px-3 py-2">
                      <p className="text-xs text-teal-700 font-medium">Recommended by {r.doctor_name}</p>
                      {r.notes && <p className="text-sm text-zinc-700 mt-1">{r.notes}</p>}
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <p className="text-xs text-zinc-400">
                        {new Date(r.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </p>
                      {isBooked ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-emerald-700">✓ Surgery Package Booked</span>
                          <Link
                            href={`/patient/surgery-bookings/${r.booking_id}`}
                            className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors">
                            View Booking →
                          </Link>
                        </div>
                      ) : (
                        <Link
                          href={`/packages/${r.package_slug}`}
                          className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors">
                          View Package →
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
