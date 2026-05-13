"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { SurgeryBookingList } from "@/types/api";

// Extend the base type with the new field
type Booking = SurgeryBookingList & { recommended_by_doctor?: string | null };
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_COLORS: Record<string, string> = {
  info_pending:    "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
  payment_pending: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
  confirmed:       "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  completed:       "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-100",
  cancelled:       "bg-zinc-100 text-zinc-400 border-zinc-200 hover:bg-zinc-100",
};

const STATUS_LABEL: Record<string, string> = {
  info_pending: "Info Pending",
  payment_pending: "Payment Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function SurgeryBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/v1/patient/surgery-bookings")
      .then((res) => setBookings(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Surgery Bookings</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Your bundled surgery packages.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/packages" className="text-sm text-teal-600 hover:underline self-center">
              Browse Packages →
            </Link>
            <Link href="/patient" className="text-sm text-zinc-500 hover:underline self-center">
              ← Dashboard
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-400">Loading…</p>
        ) : bookings.length === 0 ? (
          <Card className="border border-zinc-200 shadow-sm">
            <CardContent className="pt-8 pb-8 text-center space-y-3">
              <p className="text-sm text-zinc-500">No surgery bookings yet.</p>
              <Link href="/packages"
                className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors">
                Browse Packages
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <Card key={b.id} className="border border-zinc-200 shadow-sm">
                <CardContent className="pt-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-900">{b.package_name}</p>
                    <p className="text-sm text-zinc-500">{b.hospital_name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {b.surgery_type.replace(/_/g, " ")} · Tentative: {new Date(b.tentative_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                    <p className="text-sm font-medium text-zinc-700 mt-1">
                      ${Number(b.total_amount_usd).toLocaleString()} USD
                    </p>
                    {b.recommended_by_doctor && (
                      <p className="text-xs text-teal-600 mt-0.5">Recommended by {b.recommended_by_doctor}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge className={STATUS_COLORS[b.status] ?? ""}>{STATUS_LABEL[b.status] ?? b.status}</Badge>
                    <Link href={`/patient/surgery-bookings/${b.id}`}
                      className="text-xs text-teal-600 hover:underline">
                      View Details →
                    </Link>
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
