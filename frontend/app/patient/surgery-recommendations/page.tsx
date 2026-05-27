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
  status: "pending_admin" | "approved" | "rejected";
  admin_notes: string;
  created_at: string;
  booking_id: number | null;
  booking_status: string | null;
}

function roughPrice(priceUsd: string): string {
  const n = parseFloat(priceUsd);
  const rounded = Math.round(n / 500) * 500;
  return `~$${rounded.toLocaleString()}`;
}

const BOOKING_STATUS_COLORS: Record<string, string> = {
  info_pending:    "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  payment_pending: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  confirmed:       "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  completed:       "bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800",
  cancelled:       "bg-zinc-100 text-zinc-400 border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-700 dark:text-zinc-500 dark:border-zinc-600",
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
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Surgery Recommendations</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Surgery packages your doctor has recommended.</p>
          </div>
          <Link href="/patient" className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline">← Dashboard</Link>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">Loading…</p>
        ) : recommendations.length === 0 ? (
          <Card className="border border-zinc-200 dark:border-zinc-700 shadow-sm">
            <CardContent className="pt-8 pb-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No recommendations yet. Your doctor will send surgery recommendations after your consultation.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {recommendations.map((r) => {
              const isPending  = r.status === "pending_admin";
              const isRejected = r.status === "rejected";
              const isApproved = r.status === "approved";
              const isBooked   = isApproved && !!r.booking_id;

              const cardCls = isPending
                ? "border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-zinc-800"
                : isRejected
                ? "border border-red-200 dark:border-red-800 bg-red-50/40 dark:bg-zinc-800"
                : isBooked
                ? "border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-zinc-800"
                : "border border-teal-200 dark:border-teal-800 bg-teal-50/60 dark:bg-zinc-800";

              return (
                <Card key={r.id} className={`shadow-sm ${cardCls}`}>
                  <CardContent className="pt-5 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-white">{r.package_name}</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-300">{r.hospital_name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{r.surgery_type}</p>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        {isPending ? (
                          <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{roughPrice(r.price_usd)}</p>
                        ) : (
                          <p className="text-lg font-bold text-teal-700 dark:text-teal-400">${parseFloat(r.price_usd).toLocaleString()}</p>
                        )}
                        {isBooked && r.booking_status && (
                          <Badge className={BOOKING_STATUS_COLORS[r.booking_status] ?? ""}>
                            {BOOKING_STATUS_LABEL[r.booking_status] ?? r.booking_status}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Doctor note */}
                    <div className="rounded-lg bg-white dark:bg-zinc-700 border border-zinc-100 dark:border-zinc-600 px-3 py-2">
                      <p className="text-xs text-teal-700 dark:text-teal-400 font-medium">Recommended by {r.doctor_name}</p>
                      {r.notes && <p className="text-sm text-zinc-700 dark:text-zinc-200 mt-1">{r.notes}</p>}
                    </div>

                    {/* Status banners */}
                    {isPending && (
                      <div className="flex items-center gap-2.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 px-3 py-2.5">
                        <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Awaiting Admin Approval</p>
                          <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                            Your doctor has recommended this surgery. Our team is reviewing it — you will be able to book once approved.
                          </p>
                        </div>
                      </div>
                    )}

                    {isRejected && (
                      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2.5">
                        <p className="text-xs font-semibold text-red-700 dark:text-red-400">Recommendation Not Approved</p>
                        {r.admin_notes && <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1">{r.admin_notes}</p>}
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Please contact support or discuss with your doctor.</p>
                      </div>
                    )}

                    {isApproved && r.admin_notes && !isBooked && (
                      <div className="rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 px-3 py-2">
                        <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">Message from Admin</p>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">{r.admin_notes}</p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        {new Date(r.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </p>
                      {isPending || isRejected ? (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          isPending
                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        }`}>
                          {isPending ? "Pending Approval" : "Not Approved"}
                        </span>
                      ) : isBooked ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">✓ Booked</span>
                          <Link href={`/patient/surgery-bookings/${r.booking_id}`}
                            className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors">
                            View Booking →
                          </Link>
                        </div>
                      ) : (
                        <Link href={`/patient/surgery-bookings/new/${r.package}`}
                          className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors">
                          Book Now →
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
